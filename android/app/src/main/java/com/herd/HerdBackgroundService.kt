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
import kotlinx.parcelize.Parcelize

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

  companion object {
    var running : Boolean = false;
  }

  inner class LocalBinder : Binder() {
    fun getService() : HerdBackgroundService = this@HerdBackgroundService
  }
  private val binder = LocalBinder();

  override fun onCreate() {
      Log.i(TAG, "Service onCreate")
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
    }

    override fun onCharacteristicRead(gatt: BluetoothGatt, characteristic: BluetoothGattCharacteristic, status: Int) {
       Log.i(TAG,"Bluetooth GATT Client Callback onCharacteristicRead");
    }

    override fun onCharacteristicWrite(gatt: BluetoothGatt, characteristic: BluetoothGattCharacteristic, status: Int) {
         Log.i(TAG,"Bluetooth GATT Client Callback onCharacteristicWrite");
    }

    override fun onDescriptorRead(gatt: BluetoothGatt, descriptor: BluetoothGattDescriptor, status: Int) {
        Log.i(TAG,"Bluetooth GATT Client Callback onDescriptorRead");
    }

    override fun onDescriptorWrite(gatt: BluetoothGatt, descriptor: BluetoothGattDescriptor, status: Int) {
        Log.i(TAG,"Bluetooth GATT Client Callback onDescriptorWrite");
    }
  }

  val leScanCallback: ScanCallback = object : ScanCallback() {
      val deviceList = mutableSetOf<BluetoothDevice>();
      override fun onScanResult(callbackType: Int, result: ScanResult) {
          super.onScanResult(callbackType, result);
          Log.i(TAG, "BLE Scan Result Callback Invoked")
          //perform actions related to finding a device
          val device : BluetoothDevice = result.getDevice();
          val name = device.getName();
          val address = device.getAddress();
          var gattInstance : BluetoothGatt? = null;

          if(callbackType == ScanSettings.CALLBACK_TYPE_MATCH_LOST) {
            if(deviceList.contains(device)) {
              deviceList.remove(device);
              Log.i(TAG,"Device removed from device list");
              if(gattInstance != null) {
                gattInstance.close();
              }
            }
          }
          else {
            if(!(deviceList.contains(device))) {
              deviceList.add(device);
              if(address != null) {
                val remoteDeviceInstance = bluetoothAdapter?.getRemoteDevice(address);
                gattInstance = remoteDeviceInstance?.connectGatt(
                  context,
                  true,
                  bluetoothGattClientCallback,
                  BluetoothDevice.TRANSPORT_LE
                );
              }
            }
          }
          Log.i(TAG, "device name : " + name);
          Log.i(TAG, "device Address : " + address);
          Log.i(TAG,"Device List Length : " + deviceList.size);
      }
  }

  fun scanLeDevice() {
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

      BLEScanner?.startScan(listOf(filter),settings,leScanCallback);
      /* BLEScanner?.startScan(leScanCallback); */
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

  fun advertiseLE() {
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

  private val bluetoothGattServerCallback : BluetoothGattServerCallback = object : BluetoothGattServerCallback() {
    override fun onConnectionStateChange(device : BluetoothDevice, stats : Int, newState : Int) {
      Log.i(TAG,"Bluetooth GATT Server Callback onConnectionStateChange");
    }

    override fun onCharacteristicReadRequest(device : BluetoothDevice, requestId : Int,
      offset : Int, characteristic : BluetoothGattCharacteristic) {
        Log.i(TAG,"Bluetooth GATT Server Callback onCharacteristicReadRequest");
    }

    override fun onCharacteristicWriteRequest(device : BluetoothDevice, requestId : Int,
       characteristic : BluetoothGattCharacteristic, preparedWrite : Boolean,
       responseNeeded : Boolean, offset : Int, value : ByteArray) {
         Log.i(TAG,"Bluetooth GATT Server Callback onCharacteristicWriteRequest");
    }

    override fun onDescriptorReadRequest(device : BluetoothDevice, requestId : Int,
      offset : Int, descriptor : BluetoothGattDescriptor) {
        Log.i(TAG,"Bluetooth GATT Server Callback onDescriptorReadRequest");
    }

    override fun onDescriptorWriteRequest(device : BluetoothDevice, requestId : Int,
      descriptor : BluetoothGattDescriptor, preparedWrite : Boolean,
      responseNeeded : Boolean, offset : Int, value : ByteArray) {
        Log.i(TAG,"Bluetooth GATT Server Callback onDescriptorWriteRequest");
    }
  }


  fun startGATTService() {
    try {
      val gattCharacteristicUUID : UUID = UUID.fromString("7a38fab9-c286-402d-ac6d-6b79c1cbf329")

      val service : BluetoothGattService = BluetoothGattService(serviceUUID,BluetoothGattService.SERVICE_TYPE_PRIMARY);
      val characteristic : BluetoothGattCharacteristic = BluetoothGattCharacteristic(gattCharacteristicUUID,
        BluetoothGattCharacteristic.PROPERTY_READ or BluetoothGattCharacteristic.PROPERTY_WRITE or
        BluetoothGattCharacteristic.PROPERTY_NOTIFY,
        BluetoothGattCharacteristic.PERMISSION_READ or BluetoothGattCharacteristic.PERMISSION_WRITE);
        /* characteristic.addDescriptor(BluetoothGattDescriptor(UUID.fromString("00002902-0000-1000-8000-00805f9b34fb"), BluetoothGattCharacteristic.PERMISSION_WRITE)); */
        service.addCharacteristic(characteristic);

        gattServer?.addService(service);
        gattServer = bluetoothManager?.openGattServer(this, bluetoothGattServerCallback);
        Log.i(TAG,"BLE Gatt Server Started");
    }
    catch(e : Exception) {
      Log.d(TAG,"Error creating bluetooth GATT Server : " + e);
    }
  }

  fun addMessage(message : HerdMessage) : Boolean {
    return messageQueue?.add(message) as Boolean;
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

  fun getReceivedMessages() : ArrayList<HerdMessage> {
    return receivedMessages;
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.i(TAG, "Service onStartCommand " + startId)
        val bundle : Bundle? = intent?.getExtras();
        messageQueue = bundle?.getParcelableArrayList("messageQueue");
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
