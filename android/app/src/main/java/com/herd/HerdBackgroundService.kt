package com.herd

import android.app.Service
import android.content.Intent
import android.content.Context
import android.os.IBinder
import android.os.Binder
import android.util.Log

import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothProfile
import android.bluetooth.le.BluetoothLeScanner
import android.bluetooth.le.BluetoothLeAdvertiser
import android.bluetooth.le.AdvertiseData
import android.bluetooth.le.AdvertisingSetParameters
import android.bluetooth.le.AdvertisingSetCallback
import android.bluetooth.le.AdvertisingSet
import android.bluetooth.le.ScanCallback
import android.bluetooth.le.ScanResult
import android.bluetooth.le.ScanFilter
import android.bluetooth.le.ScanSettings

import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothManager
import android.bluetooth.BluetoothGatt
import android.bluetooth.BluetoothGattService
import android.bluetooth.BluetoothGattServer
import android.bluetooth.BluetoothGattServerCallback
import android.bluetooth.BluetoothGattCallback
import android.bluetooth.BluetoothGattCharacteristic
import android.bluetooth.BluetoothGattDescriptor

import android.os.Handler
import android.os.ParcelUuid
import java.util.UUID
import java.util.ArrayList
import android.os.Bundle
import android.os.Parcelable
import android.os.Parcel
import kotlinx.parcelize.Parcelize
import android.os.Looper

import android.app.Notification
import android.app.NotificationManager
import android.app.NotificationChannel
import android.app.PendingIntent
import android.R.drawable

import com.herd.HerdMessage

class HerdBackgroundService : Service() {
  private val TAG = "HerdBackgroundService";
  private var bluetoothAdapter : BluetoothAdapter? = null;
  private var BLEScanner : BluetoothLeScanner? = null;
  private var BLEAdvertiser : BluetoothLeAdvertiser? = null;
  private val serviceUUID = UUID.fromString("30895318-6f7e-4f68-b21a-01a4e2f946fa");
  private final val parcelServiceUUID = ParcelUuid(serviceUUID);
  private var bluetoothManager : BluetoothManager? = null;
  private var gattServer : BluetoothGattServer? = null;
  private val context : Context = this;
  private var messageQueue : ArrayList<HerdMessage>? = ArrayList();
  private var messagePointer : Int = 0;
  private var receivedMessages : ArrayList<HerdMessage> = ArrayList();
  private var currentMessageBytes : ByteArray = byteArrayOf();
  val bleDeviceList = mutableSetOf<BluetoothDevice>();
  private var remoteMessageQueueSize : Int = 0;

  private lateinit var messageQueueServiceUUID : UUID;
  private lateinit var messageQueueCharacteristicUUID : UUID;
  private lateinit var messageQueueDescriptorUUID : UUID;

  @Volatile
  private var allowBleScan : Boolean = true;

  companion object {
    var running : Boolean = false;
  }

  inner class LocalBinder : Binder() {
    fun getService() : HerdBackgroundService = this@HerdBackgroundService
  }
  private val binder = LocalBinder();

  override fun onCreate() {
      Log.i(TAG, "Service onCreate")
      messageQueueServiceUUID = UUID.fromString(getString(R.string.messageQueueServiceUUID))
      messageQueueCharacteristicUUID = UUID.fromString(getString(R.string.messageQueueCharacteristicUUID))
      messageQueueDescriptorUUID = UUID.fromString(getString(R.string.messageQueueDescriptorUUID))
      try {
        bluetoothAdapter = BluetoothAdapter.getDefaultAdapter();
        if(bluetoothAdapter === null) {
          throw Exception("No Bluetooth Adapter Found");
        }

        BLEScanner = bluetoothAdapter?.bluetoothLeScanner;
        if(BLEScanner === null) {
          throw Exception("No BLE Scanner Found");
        }

        val pendingIntent: PendingIntent = Intent(this, MainActivity::class.java).let { notificationIntent ->
            PendingIntent.getActivity(this, 0, notificationIntent, 0)
        }

        //create notification channel
        val CHANNEL_ID = "HerdServiceChannel"
        val name = "Herd Service Channel"
        val descriptionText = "Herd Background Service"
        val importance = NotificationManager.IMPORTANCE_DEFAULT
        val mChannel = NotificationChannel(CHANNEL_ID, name, importance)
        mChannel.description = descriptionText
        // Register the channel with the system; you can't change the importance
        // or other notification behaviors after this
        val notificationManager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.createNotificationChannel(mChannel)

        //create notification
        val notification : Notification = Notification.Builder(this,CHANNEL_ID)
        .setOngoing(true)
        .setContentTitle("Herd Background Service")
        .setContentText("Herd is Running in the background in order to transfer messages")
        .setContentIntent(pendingIntent)
        .setSmallIcon(R.mipmap.ic_launcher)
        .setCategory(Notification.CATEGORY_SERVICE)
        .build()

        try {
          startForeground(5,notification)
        }
        catch(e : Exception) {
          Log.e(TAG, "Error starting service in foreground")
        }
      }
      catch(e : Exception) {
        Log.e(TAG, "Error creating background service",e)
      }
  }

  private val bluetoothGattClientCallback : BluetoothGattCallback = object : BluetoothGattCallback() {
    override fun onConnectionStateChange(gatt: BluetoothGatt, status: Int, newState: Int) {
      Log.i(TAG,"Bluetooth GATT Client Callback onConnectionStateChange. Status : " + status + ", STATE : " + when(newState) {
          BluetoothProfile.STATE_DISCONNECTED -> "STATE_DISCONNECTED"
          BluetoothProfile.STATE_DISCONNECTING -> "STATE_DISCONNECTING"
          BluetoothProfile.STATE_CONNECTED -> "STATE_CONNECTED"
          BluetoothProfile.STATE_CONNECTING -> "STATE_CONNECTING"
          else -> "UNKNOWN STATE"
      });
      if(newState === BluetoothProfile.STATE_CONNECTED) {
        gatt.requestMtu(151);
        /* Log.i(TAG,"Discovering GATT Services");
        BLEScanner?.stopScan(leScanCallback);
        gatt.discoverServices(); */
      }
      else if (newState === BluetoothProfile.STATE_DISCONNECTED) {
        scanLeDevice();
      }
    }

    override fun onMtuChanged(gatt : BluetoothGatt, mtu : Int, status : Int) {
      if(status == BluetoothGatt.GATT_SUCCESS) {
        Log.i(TAG,"MTU Succesfully changed to : $mtu");
      }
      else {
        Log.i(TAG,"MTU Request failed, MTU changed to $mtu");
      }
      Log.i(TAG,"Discovering GATT Services");
      BLEScanner?.stopScan(leScanCallback);
      allowBleScan = false;
      Log.i(TAG,"Waiting 30 seconds before allowing another BLE Scan");
      Handler(Looper.getMainLooper()).postDelayed({
          Log.i(TAG,"30 Second wait over, new BLE Scan now allowed");
          allowBleScan = true;
      },30000)
      gatt.discoverServices();
    }

    var totalBytes : ByteArray = byteArrayOf();
    var totalMessagesRead : Int = 0;
    override fun onCharacteristicRead(gatt: BluetoothGatt, characteristic: BluetoothGattCharacteristic, status: Int) {
       Log.i(TAG,"Bluetooth GATT Client Callback onCharacteristicRead, status : $status");
       Log.i(TAG,"UUID : ${characteristic.uuid.toString()}")
       val messageBytes : ByteArray = characteristic.getValue();
       totalBytes += messageBytes
       Log.i(TAG,"Received ${messageBytes.size} Bytes");
       if(messageBytes.size != 0) {
         gatt?.readCharacteristic(characteristic)
       }
       else {
         Log.i(TAG,"Done reading Message, total size : ${totalBytes.size}");
         totalMessagesRead += 1;
         try {
           //create parcel and custom parcelable from received bytes
           val parcelMessage : Parcel = Parcel.obtain();
           parcelMessage.unmarshall(totalBytes,0,totalBytes.size);
           parcelMessage.setDataPosition(0);
           val message : HerdMessage = HerdMessage.CREATOR.createFromParcel(parcelMessage);
           //add custom parcelable to received array
           receivedMessages.add(message)
           Log.i(TAG,"Message : " + message.text)
           //reset array for total bytes
           totalBytes = byteArrayOf();
           //check if there are more messages to read
           if(totalMessagesRead < remoteMessageQueueSize) {
             Log.i(TAG,"Messages Read : $totalMessagesRead/$remoteMessageQueueSize");
             /* Log.i(TAG,"Waiting 10 Seconds before reading next message");

             Handler(Looper.getMainLooper()).postDelayed({
                 Log.i(TAG,"Starting to read next Message");
                 gatt?.readCharacteristic(characteristic);
             },10000) */
             Log.i(TAG,"Starting to read next Message");
             gatt?.readCharacteristic(characteristic);
           }
           else {
             //end connection with this device
             bleDeviceList.remove(gatt.getDevice())
             gatt.close();
             totalMessagesRead = 0;
             //start scanning for new devices
             scanLeDevice();
           }
         }
         catch(e : Exception) {
           Log.d(TAG,"Error creating message from parcel : ",e)
         }
       }
       /* val parcelMessage : Parcel = Parcel.obtain();
       parcelMessage.unmarshall(messageBytes,0,messageBytes.size);
       parcelMessage.setDataPosition(0); */
       /* Log.i(TAG,"Characteristic : " + messageBytes); */

       /* try {
         val Message : HerdMessage = HerdMessage.CREATOR.createFromParcel(parcelMessage);
         Log.i(TAG,"Message : " + Message.text)
       }
       catch(e : Exception) {
         Log.d(TAG,"Error creating message from parcel : ",e)
       } */
    }

    override fun onCharacteristicWrite(gatt: BluetoothGatt, characteristic: BluetoothGattCharacteristic, status: Int) {
         Log.i(TAG,"Bluetooth GATT Client Callback onCharacteristicWrite");
    }

    override fun onDescriptorRead(gatt: BluetoothGatt, descriptor: BluetoothGattDescriptor, status: Int) {
        Log.i(TAG,"Bluetooth GATT Client Callback onDescriptorRead, status : $status");
        if(descriptor.getUuid().equals(messageQueueDescriptorUUID)) {
          try {
            //receive remote messageQueue size and start reading messages
            remoteMessageQueueSize = descriptor.getValue().get(0).toInt();
            Log.i(TAG,"Remote Message Queue Size : $remoteMessageQueueSize");
            gatt.readCharacteristic(descriptor.getCharacteristic());
          }
          catch(e : Exception) {
            Log.i(TAG,"Error getting remote message queue size.",e);
          }
        }
    }

    override fun onDescriptorWrite(gatt: BluetoothGatt, descriptor: BluetoothGattDescriptor, status: Int) {
        Log.i(TAG,"Bluetooth GATT Client Callback onDescriptorWrite");
    }

    override fun onServicesDiscovered(gatt : BluetoothGatt, status : Int) {
      Log.i(TAG, "onServicesDiscovered fires, status : $status");
      if(status == BluetoothGatt.GATT_SUCCESS) {
        val services = gatt.getServices();

        val messageService : BluetoothGattService? = services.find {
          service -> service.uuid.equals(messageQueueServiceUUID)
        };

        val messageCharacteristic : BluetoothGattCharacteristic? =
        messageService?.characteristics?.find { characteristic ->
          characteristic.uuid.equals(messageQueueCharacteristicUUID)
        };

        if(messageCharacteristic != null) {
          Log.i(TAG,"Characteristic with matching UUID found, reading descriptor.")
          gatt.readDescriptor(messageCharacteristic.getDescriptor(messageQueueDescriptorUUID));
        }
        else {
          Log.i(TAG,"No Matching service/characteristic found, removing device and restarting scan");
          bleDeviceList.remove(gatt.getDevice());
          gatt.close();
          scanLeDevice();
        }
      }
    }
  }

  private val leScanCallback: ScanCallback = object : ScanCallback() {

      var gattInstance : BluetoothGatt? = null;
      override fun onScanResult(callbackType: Int, result: ScanResult) {
          super.onScanResult(callbackType, result);
          Log.i(TAG, "BLE Scan Result Callback Invoked")
          //perform actions related to finding a device
          val device : BluetoothDevice = result.getDevice();
          val name = device.getName();
          val address = device.getAddress();

          if(callbackType == ScanSettings.CALLBACK_TYPE_MATCH_LOST) {
            if(bleDeviceList.contains(device)) {
              bleDeviceList.remove(device);
              Log.i(TAG,"Device removed from device list");
              if(gattInstance != null) {
                gattInstance?.close();
              }
            }
          }
          else {
            if(!(bleDeviceList.contains(device))) {
              bleDeviceList.add(device);
              if(address != null) {
                val remoteDeviceInstance = bluetoothAdapter?.getRemoteDevice(address);
                if(gattInstance != null) {
                  gattInstance?.close();
                }
                remoteDeviceInstance?.connectGatt(
                  context,
                  false,
                  bluetoothGattClientCallback,
                  BluetoothDevice.TRANSPORT_LE
                );
              }
            }
          }
          Log.i(TAG, "device name : " + name);
          Log.i(TAG, "device Address : " + address);
          Log.i(TAG,"Device List Length : " + bleDeviceList.size);
      }
  }

  private fun scanLeDevice() {
      /* var scanning = false;
      val handler = Handler();

      val SCAN_PERIOD : Long = 10000; */

      /* BLEScanner?.let { scanner ->
          if (!scanning) { // Stops scanning after a pre-defined scan period.
              handler.postDelayed({
                  scanning = false
                  scanner.stopScan(leScanCallback)
              }, SCAN_PERIOD)
              scanning = true
              scanner.startScan(leScanCallback)
          } else {
              scanning = false
              scanner.stopScan(leScanCallback)
          }
      } */
      val bitmask = ParcelUuid(UUID.fromString("ffffffff-ffff-ffff-ffff-ffffffffffff"));
      val filter = ScanFilter.Builder()
      .setServiceUuid(parcelServiceUUID,bitmask)
      .build()

      val settings = ScanSettings.Builder()
      .setScanMode(ScanSettings.SCAN_MODE_LOW_POWER)
      /* .setCallbackType(ScanSettings.CALLBACK_TYPE_ALL_MATCHES) */
      .setCallbackType(ScanSettings.CALLBACK_TYPE_FIRST_MATCH or ScanSettings.CALLBACK_TYPE_MATCH_LOST)
      .setMatchMode(ScanSettings.MATCH_MODE_STICKY)
      .setPhy(ScanSettings.PHY_LE_ALL_SUPPORTED)
      .build()

      //wait 30 seconds before starting scan again after stopping
      while(!allowBleScan){};
      //double check service is still running before starting scan
      //as blocking call above prevents this section from being notified
      BLEScanner?.startScan(listOf(filter),settings,leScanCallback);
      Log.i(TAG,"BLE Scanning started");
  }

  private val advertisingCallback : AdvertisingSetCallback = object : AdvertisingSetCallback() {
    override fun onAdvertisingSetStarted(advertisingSet : AdvertisingSet?, txPower : Int, status : Int) {
      Log.i(TAG, "onAdvertisingSetStarted(): txPower:" + txPower + " , status: "
      + status);
      /* currentAdvertisingSet = advertisingSet; */
    }

    override fun onAdvertisingDataSet(advertisingSet : AdvertisingSet?, status : Int) {
      Log.i(TAG, "onAdvertisingDataSet() :status:" + status);
    }

    override fun onScanResponseDataSet(advertisingSet : AdvertisingSet?,status : Int) {
      Log.i(TAG, "onScanResponseDataSet(): status:" + status);
    }

    override fun onAdvertisingSetStopped(advertisingSet : AdvertisingSet?) {
      Log.i(TAG, "onAdvertisingSetStopped():");
    }
  };

  private fun advertiseLE() {
    //https://source.android.com/devices/bluetooth/ble_advertising
    BLEAdvertiser = BluetoothAdapter.getDefaultAdapter().getBluetoothLeAdvertiser();
    if(BLEAdvertiser != null) {
      var useLegacyMode : Boolean = false;
      Log.i(TAG,"Bluetooth LE Advertiser Found");
      // Check if all features are supported
      if (!(bluetoothAdapter?.isLe2MPhySupported() as Boolean)) {
          Log.e(TAG, "2M PHY not supported!");
          useLegacyMode = true;
      }

      var advertisingParameters = AdvertisingSetParameters.Builder()
      .setInterval(AdvertisingSetParameters.INTERVAL_LOW)
      .setTxPowerLevel(AdvertisingSetParameters.TX_POWER_LOW)
      .setConnectable(true)

      var advertisingData = AdvertiseData.Builder()
      .addServiceUuid(parcelServiceUUID)
      .setIncludeDeviceName(true);

      if (!(bluetoothAdapter?.isLeExtendedAdvertisingSupported() as Boolean)) {
        Log.e(TAG, "LE Extended Advertising not supported!");
        //dont include device name when extended advertising is not supported as only 31 bytes are available
        advertisingData.setIncludeDeviceName(false);
        useLegacyMode = true;
      }

      if(!useLegacyMode) {
        Log.i(TAG,"Using BLE 5 2MPHY with extended advertising")

        advertisingParameters
        .setLegacyMode(false)
        .setPrimaryPhy(BluetoothDevice.PHY_LE_1M)
        .setSecondaryPhy(BluetoothDevice.PHY_LE_2M);
      }
      else {
        Log.i(TAG,"Using Legacy BLE advertising")

        advertisingParameters
        .setLegacyMode(true)
        .setScannable(true);
      }
      BLEAdvertiser?.startAdvertisingSet(
        advertisingParameters.build(),
        advertisingData?.build(),
        null,null,null,
        advertisingCallback
      )
    }
  }

  var offsetSize : Int = 0;
  var currentPacket : Int = 0;
  private val bluetoothGattServerCallback : BluetoothGattServerCallback = object : BluetoothGattServerCallback() {
    override fun onConnectionStateChange(device : BluetoothDevice, status : Int, newState : Int) {
      Log.i(TAG,"Bluetooth GATT Server Callback onConnectionStateChange. Status : " + status + ", STATE : " + when(newState) {
          BluetoothProfile.STATE_DISCONNECTED -> "STATE_DISCONNECTED"
          BluetoothProfile.STATE_DISCONNECTING -> "STATE_DISCONNECTING"
          BluetoothProfile.STATE_CONNECTED -> "STATE_CONNECTED"
          BluetoothProfile.STATE_CONNECTING -> "STATE_CONNECTING"
          else -> "UNKNOWN STATE"
      });
    }

    override fun onCharacteristicReadRequest(device : BluetoothDevice, requestId : Int,
      offset : Int, characteristic : BluetoothGattCharacteristic) {
        Log.i(TAG,"Bluetooth GATT Server Callback onCharacteristicReadRequest, id : $requestId, offset : $offset");
        try {
          if((messageQueue?.size as Int) > messagePointer){
            //increment packet for offset calculation
            currentPacket += 1;
            //get MTU rate by looking at initial offset sent with third request
            //first request is descriptor read, second request has offset 0
            //third request has first actuall MTU value
            if(requestId == 3) {
              offsetSize = offset;
            }
            Log.i(TAG,"Char Read Req Total Parcel Size : ${currentMessageBytes.size}")
            //calculate current offset in total array for sending current chunk
            val currentOffset : Int = offsetSize * (currentPacket - 1);
            Log.i(TAG,"Current Message Offset : $currentOffset");
            if(currentOffset < currentMessageBytes.size) {
              //create current subArray starting from offset
              val currentCopy = currentMessageBytes.copyOfRange(currentOffset,currentMessageBytes.lastIndex + 1);
              /* gattServer?.sendResponse(device,requestId,BluetoothGatt.GATT_SUCCESS,offsetSize * requestId - 1,parcelBytes); */
              gattServer?.sendResponse(device,requestId,BluetoothGatt.GATT_SUCCESS,0,currentCopy);
            }
            else {
              //send empty array to indicate that transfer is done to client
              gattServer?.sendResponse(device,requestId,BluetoothGatt.GATT_SUCCESS,0,byteArrayOf());
              //reset currentPacket counter for next message
              currentPacket = 0;
              //update message pointer to point to next message with boundary check
              messagePointer = if (messagePointer < ( (messageQueue?.size as Int) - 1) ) (messagePointer + 1) else 0;
              //create new byteArray for next message to be sent
              createCurrentMessageBytes(messageQueue?.get(messagePointer));
              Log.i(TAG,"Message Succesfully sent, messageQueue length : ${messageQueue?.size}, messagePointer : $messagePointer");
            }
          }
        }
        catch(e : Exception) {
          Log.d(TAG,"Error sending onCharacteristicReadRequest response : ",e);
        }
    }

    override fun onCharacteristicWriteRequest(device : BluetoothDevice, requestId : Int,
       characteristic : BluetoothGattCharacteristic, preparedWrite : Boolean,
       responseNeeded : Boolean, offset : Int, value : ByteArray) {
         Log.i(TAG,"Bluetooth GATT Server Callback onCharacteristicWriteRequest");
    }

    override fun onDescriptorReadRequest(device : BluetoothDevice, requestId : Int,
      offset : Int, descriptor : BluetoothGattDescriptor) {
        Log.i(TAG,"Bluetooth GATT Server Callback onDescriptorReadRequest");
        if(descriptor.getUuid().equals(messageQueueDescriptorUUID)) {
          gattServer?.sendResponse(device,requestId,BluetoothGatt.GATT_SUCCESS,0,byteArrayOf((messageQueue?.size as Int).toByte()))
        }
    }

    override fun onDescriptorWriteRequest(device : BluetoothDevice, requestId : Int,
      descriptor : BluetoothGattDescriptor, preparedWrite : Boolean,
      responseNeeded : Boolean, offset : Int, value : ByteArray) {
        Log.i(TAG,"Bluetooth GATT Server Callback onDescriptorWriteRequest");
    }

    override fun onServiceAdded(status : Int, service : BluetoothGattService) {
      Log.i(TAG,"GATT Server onServiceAdded, status : $status");
    }
  }


  private fun startGATTService() {
    try {
      val service : BluetoothGattService = BluetoothGattService(messageQueueServiceUUID,BluetoothGattService.SERVICE_TYPE_PRIMARY);

      /* val characteristic : BluetoothGattCharacteristic = BluetoothGattCharacteristic(messageQueueCharacteristicUUID,
      BluetoothGattCharacteristic.PROPERTY_READ or
      BluetoothGattCharacteristic.PROPERTY_NOTIFY or
      BluetoothGattCharacteristic.PROPERTY_BROADCAST,
      BluetoothGattCharacteristic.PERMISSION_READ); */
      val characteristic : BluetoothGattCharacteristic = BluetoothGattCharacteristic(messageQueueCharacteristicUUID,
      BluetoothGattCharacteristic.PROPERTY_READ,
      BluetoothGattCharacteristic.PERMISSION_READ);

      val descriptor : BluetoothGattDescriptor = BluetoothGattDescriptor(
      messageQueueDescriptorUUID,
      BluetoothGattDescriptor.PERMISSION_READ);

      characteristic.addDescriptor(descriptor);
      //change to mitm protected read once working
      /* val descriptor : BluetoothGattDescriptor = BluetoothGattDescriptor(messageQueueDescriptorUUID,BluetoothGattDescriptor.PERMISSION_READ_ENCRYPTED_MITM); */
      /* characteristic.addDescriptor(BluetoothGattDescriptor(UUID.fromString("00002902-0000-1000-8000-00805f9b34fb"), BluetoothGattCharacteristic.PERMISSION_WRITE)); */

      service.addCharacteristic(characteristic);

      gattServer = bluetoothManager?.openGattServer(this, bluetoothGattServerCallback);
      gattServer?.addService(service);
      Log.i(TAG,"BLE Gatt Server Started");
    }
    catch(e : Exception) {
      Log.d(TAG,"Error creating bluetooth GATT Server : " + e);
    }
  }

  fun addMessage(message : HerdMessage) : Boolean {
    val added : Boolean = messageQueue?.add(message) as Boolean;
    if(added) {
      Log.i(TAG,"Added message to Queue, new length : ${messageQueue?.size}");
      //if Queue was empty initialise bytes to be sent
      if((messageQueue?.size as Int) == 1) {
        createCurrentMessageBytes(messageQueue?.get(0));
      }
    } else {
      Log.i(TAG,"Failed to add message to Queue");
    }
    return added;
  }

  fun removeMessage(messages : ArrayList<HerdMessage>) : Boolean {
    val lengthBefore : Int? = messageQueue?.size;
    messageQueue = messageQueue?.filter{msg -> messages.find{message -> message._id == msg._id} == null} as ArrayList<HerdMessage>;
    val lengthAfter : Int? = messageQueue?.size;

    var deleted : Boolean = false;
    if(lengthBefore != null && lengthAfter != null) {
      deleted = (lengthBefore - lengthAfter) == messages.size
    }
    return deleted;
  }

  private fun createCurrentMessageBytes(message : HerdMessage?) {
    val messageParcel : Parcel = Parcel.obtain();
    message?.writeToParcel(messageParcel,0);
    val parcelBytes = messageParcel.marshall();
    currentMessageBytes = parcelBytes;
  }

  fun getReceivedMessages() : ArrayList<HerdMessage> {
    return receivedMessages;
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.i(TAG, "Service onStartCommand " + startId)
        val bundle : Bundle? = intent?.getExtras();
        messageQueue = bundle?.getParcelableArrayList("messageQueue");
        //initialise byte array for sending message
        if((messageQueue?.size as Int) > 0) {
          createCurrentMessageBytes(messageQueue?.get(0))
        }
        bluetoothManager = this.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager
        startGATTService();
        scanLeDevice();
        advertiseLE();
        running = true;
        return Service.START_STICKY
    }

  override fun onBind(intent : Intent) : IBinder? {
    Log.i(TAG, "Service onBind")
    return binder;
  }

  override fun onDestroy() {
      Log.i(TAG, "Service onDestroy")
      BLEScanner?.stopScan(leScanCallback)
      BLEAdvertiser?.stopAdvertisingSet(advertisingCallback);
      gattServer?.close();
      running = false;
  }
}
