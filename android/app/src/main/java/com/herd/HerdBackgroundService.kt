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
import java.util.concurrent.atomic.AtomicBoolean
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import android.os.Bundle
import android.os.Parcelable
import android.os.Parcel
import kotlinx.parcelize.Parcelize
import android.os.Looper
import android.location.LocationManager

import android.content.BroadcastReceiver
import android.content.IntentFilter

import android.app.Notification
import android.app.NotificationManager
import android.app.NotificationChannel
import android.app.PendingIntent
import android.R.drawable

import com.herd.HerdMessage
import com.herd.StorageInterface

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
  private var deletedMessages : ArrayList<HerdMessage>? = ArrayList();
  private var receivedMessages : ArrayList<HerdMessage> = ArrayList();
  private var receivedMessagesForSelf : ArrayList<HerdMessage>? = ArrayList();
  private val messagesToRemoveFromQueue : ArrayList<HerdMessage> = ArrayList();
  private var currentMessageBytes : ByteArray = byteArrayOf();
  private val bleDeviceList = mutableSetOf<BluetoothDevice>();
  private var remoteMessageQueueSize : Int = 0;
  private var publicKey : String? = null;
  private val bleScanningThreadActive = AtomicBoolean(false);

  private lateinit var messageQueueServiceUUID : UUID;
  private lateinit var messageQueueCharacteristicUUID : UUID;
  private lateinit var messageQueueDescriptorUUID : UUID;
  private lateinit var transferCompleteCharacteristicUUID : UUID;

  @Volatile
  private var allowBleScan : Boolean = true;

  companion object {
    @Volatile
    var running : Boolean = false;
  }

  inner class LocalBinder : Binder() {
    fun getService() : HerdBackgroundService = this@HerdBackgroundService
  }
  private val binder = LocalBinder();

  private final val bluetoothStateReceiver = object : BroadcastReceiver() {
    override fun onReceive(context : Context, intent : Intent) {
      val action : String? = intent.action
      if (BluetoothAdapter.ACTION_STATE_CHANGED.equals(action)) {
        if (intent.getIntExtra(BluetoothAdapter.EXTRA_STATE, -1) == BluetoothAdapter.STATE_OFF) {
          Log.i(TAG,"Bluetooth Turned off, stopping service");
          //let the user know the service is stopping
          sendNotification(
            "Herd has stopped sending messages in the background",
            "because bluetooth was turned off"
          )
          //stop this service and remove constant notification
          stopForeground(true);
          running = false;
        }
      }
    }
  }

  private final val locationStateReceiver = object : BroadcastReceiver() {
    override fun onReceive(context : Context, intent : Intent) {
      val action : String? = intent.action
      if(action === "android.location.PROVIDERS_CHANGED") {
        val locationManager = getSystemService(Context.LOCATION_SERVICE) as LocationManager;
        if(!locationManager.isLocationEnabled()) {
          Log.i(TAG,"Location has been turned off, stopping service");
          //let the user know the service is stopping
          sendNotification(
            "Herd has stopped sending messages in the background",
            "because location was turned off"
          )
          //stop this service and remove constant notification
          stopForeground(true);
          running = false;
        }
      }
    }
  }

  override fun onCreate() {
      Log.i(TAG, "Service onCreate")
      messageQueueServiceUUID = UUID.fromString(getString(R.string.messageQueueServiceUUID));
      messageQueueCharacteristicUUID = UUID.fromString(getString(R.string.messageQueueCharacteristicUUID));
      messageQueueDescriptorUUID = UUID.fromString(getString(R.string.messageQueueDescriptorUUID));
      transferCompleteCharacteristicUUID =  UUID.fromString(getString(R.string.transferCompleteCharacteristicUUID))
      try {
        bluetoothManager = this.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager
        bluetoothAdapter = bluetoothManager?.getAdapter();
        if(bluetoothAdapter === null) {
          throw Exception("No Bluetooth Adapter Found");
        }

        BLEScanner = bluetoothAdapter?.bluetoothLeScanner;
        if(BLEScanner === null) {
          throw Exception("No BLE Scanner Found");
        }

        val pendingIntent: PendingIntent = Intent(this, MainActivity::class.java).let { notificationIntent ->
            PendingIntent.getActivity(this, 0, notificationIntent, PendingIntent.FLAG_IMMUTABLE)
        }

        //create service notification channel
        val SERVICE_CHANNEL_ID = "HerdServiceChannel"
        val serviceChannelName = "Herd Service Channel"
        val serviceChannelDescriptionText = "Herd Background Service"
        val serviceChannlImportance = NotificationManager.IMPORTANCE_DEFAULT
        val serviceChannel = NotificationChannel(SERVICE_CHANNEL_ID, serviceChannelName, serviceChannlImportance)
        serviceChannel.description = serviceChannelDescriptionText

        //create message notification channel
        val MESSAGE_CHANNEL_ID = "HerdMessageChannel"
        val msgChannelName = "Herd Message Channel"
        val msgChannelDescriptionText = "Herd Messages"
        val msgChannelImportance = NotificationManager.IMPORTANCE_DEFAULT
        val msgChannel = NotificationChannel(MESSAGE_CHANNEL_ID, msgChannelName, msgChannelImportance)
        msgChannel.description = msgChannelDescriptionText


        // Register the channel with the system; you can't change the importance
        // or other notification behaviors after this
        val notificationManager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.createNotificationChannels(mutableListOf(serviceChannel,msgChannel))

        //create notification
        val notification : Notification = Notification.Builder(this,SERVICE_CHANNEL_ID)
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

  private fun sendNotification(title : String, text : String) {
    val pendingIntent: PendingIntent = Intent(this, MainActivity::class.java).let { notificationIntent ->
        PendingIntent.getActivity(this, 0, notificationIntent, PendingIntent.FLAG_IMMUTABLE)
    }

    //create notification
    val notification : Notification = Notification.Builder(this,"HerdMessageChannel")
    .setOngoing(false)
    .setContentTitle(title)
    .setContentText(text)
    .setContentIntent(pendingIntent)
    .setSmallIcon(R.mipmap.ic_launcher)
    .setCategory(Notification.CATEGORY_MESSAGE)
    .setAutoCancel(true)
    .build()

    Log.i(TAG,"Sending Notification for new messages");
    val notificationManager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
    notificationManager.notify(1738,notification);
  }

  private fun sendMessagesToReceiver(messages : ArrayList<HerdMessage>?) {
    val intent : Intent = Intent("com.herd.NEW_HERD_MESSAGE_RECEIVED");
    intent.putParcelableArrayListExtra("messages",messages);
    sendBroadcast(intent);
  }

  private var writebackComplete = false;
  private var remoteHasReadMessages = false;
  private val gattClientHandler = Handler(Looper.getMainLooper());
  private var clientRetryCount : Int = 0;
  private val bluetoothGattClientCallback : BluetoothGattCallback = object : BluetoothGattCallback() {
    override fun onConnectionStateChange(gatt: BluetoothGatt, status: Int, newState: Int) {
      Log.i(TAG,"Bluetooth GATT Client Callback onConnectionStateChange. Status : " + status + ", STATE : " + when(newState) {
          BluetoothProfile.STATE_DISCONNECTED -> "STATE_DISCONNECTED"
          BluetoothProfile.STATE_DISCONNECTING -> "STATE_DISCONNECTING"
          BluetoothProfile.STATE_CONNECTED -> "STATE_CONNECTED"
          BluetoothProfile.STATE_CONNECTING -> "STATE_CONNECTING"
          else -> "UNKNOWN STATE"
      } + ", Thread : ${Thread.currentThread()}");

      if(newState == BluetoothProfile.STATE_CONNECTED) {
        //max MTU is 517, max packet size is 600. 301 is highest even divisor of 600
        //that fits in MTU
        stopLeScan();
        gatt.requestMtu(301);
      }
      else if (newState == BluetoothProfile.STATE_DISCONNECTED) {
        if(status == 133 && clientRetryCount < 7) {
          gattClient?.close();
          gattClient = gatt.getDevice().connectGatt(
            context,
            false,
            this,
            BluetoothDevice.TRANSPORT_LE
          );
          clientRetryCount += 1;
        }
        else if((writebackComplete && remoteHasReadMessages) || clientRetryCount >= 7) {
          gattClient = null;
          writebackComplete = false;
          remoteHasReadMessages = false;
          clientRetryCount = 0;
          bleDeviceList.remove(gatt.getDevice());
          scanLeDevice();
        }
      }
    }

    /* private val bleScanTimeoutHandler = Handler(); */
    override fun onMtuChanged(gatt : BluetoothGatt, mtu : Int, status : Int) {
      if(status == BluetoothGatt.GATT_SUCCESS) {
        Log.i(TAG,"MTU Succesfully changed to : $mtu");
      }
      else {
        Log.i(TAG,"MTU Request failed, MTU changed to $mtu");
      }
      Log.i(TAG,"Discovering GATT Services");
      /* stopLeScan();
      allowBleScan = false;
      Log.i(TAG,"Waiting 30 seconds before allowing another BLE Scan");
      bleScanTimeoutHandler.removeCallbacksAndMessages(null);
      bleScanTimeoutHandler.postDelayed({
          Log.i(TAG,"30 Second wait over, new BLE Scan now allowed");
          allowBleScan = true;
      },30000) */

      val bondState : Int = gatt.getDevice().getBondState();
      if(bondState == BluetoothDevice.BOND_NONE || bondState == BluetoothDevice.BOND_BONDED) {
        gatt.discoverServices();
      }
      else {
        gattClientHandler.postDelayed({
          gatt.discoverServices();
        },2000)
      }
    }

    var totalBytes : ByteArray = byteArrayOf();
    var totalMessagesRead : Int = 0;
    var receivedMessagesForUser : Boolean = false;
    var messageReadTimeout : Boolean = false;
    var messageTimeoutRegistered : Boolean = false;
    val handler : Handler = Handler(Looper.getMainLooper());
    override fun onCharacteristicRead(gatt: BluetoothGatt, characteristic: BluetoothGattCharacteristic, status: Int) {
       Log.i(TAG,"Bluetooth GATT Client Callback onCharacteristicRead, status : $status");
       Log.i(TAG,"UUID : ${characteristic.uuid.toString()}")
       //get bytes for this read instance and add to overall bytes
       val messageBytes : ByteArray = characteristic.getValue();
       totalBytes += messageBytes
       Log.i(TAG,"Received ${messageBytes.size} Bytes");
       //register timeout per message to prevent infinite loop on error
       val timeoutRunnable = object : Runnable {
         override fun run() {
           Log.d(TAG,"Message read timed out");
           messageReadTimeout = true;
         }
       }
       if(!messageTimeoutRegistered) {
         messageTimeoutRegistered = handler.postDelayed(timeoutRunnable,10000);
       }
       //check if message transfer is over, signified by 0 size array being received
       if(messageBytes.size != 0 && !messageReadTimeout) {
         //continue reading until 0 size array is received
         gatt.readCharacteristic(characteristic)
       }
       //transfer is done, assemble message and save to array
       else {
         //reset message timeout
         handler.removeCallbacksAndMessages(null);
         messageTimeoutRegistered = false;
         try {
           Log.i(TAG,"Done reading Message, total size : ${totalBytes.size}");
           totalMessagesRead += 1;
           //create parcel and custom parcelable from received bytes
           val message : HerdMessage = createMessageFromBytes(totalBytes);
           //check if message has been received before, either in this instance of the background service
           //or another instance where it has already been passed up to JS side
           val messageAlreadyReceived : Boolean = (receivedMessages.find{it -> it._id.equals(message._id)}  != null) ||
           (receivedMessagesForSelf?.find{it -> it._id == message._id} != null)
           //check if message has been previously deleted by user
           val messagePreviouslyDeleted : Boolean = deletedMessages?.find{it -> it._id.equals(message._id)} != null;
           //check if message is destined for this user, set notification flag if it isnt a deleted message
           if(message.to.trim().equals(publicKey?.trim())) {
             if (!messageAlreadyReceived && !messagePreviouslyDeleted) {
               receivedMessagesForUser = true;
               receivedMessagesForSelf?.add(message);
             }
           }
           //if message is destined for other user add it directly to messageQueue
           else {
             Log.i(TAG,"Received Message is for another user, adding it to Queue");
             val messageAlreadyInQueue : Boolean = messageQueue?.find{it -> it._id.equals(message._id)} != null;
             Log.i(TAG,"message : " + message._id);
             Log.i(TAG,"Message Already in Queue : $messageAlreadyInQueue");
             if(!messageAlreadyInQueue) {
               addMessage(message);
             }
           }
           //add custom parcelable to received array
           if(!messageAlreadyReceived && !messagePreviouslyDeleted) {
             receivedMessages.add(message)
           }
           //reset array for total bytes
           totalBytes = byteArrayOf();
           //check if there are more messages to read
           if(totalMessagesRead < remoteMessageQueueSize) {
             Log.i(TAG,"Messages Read : $totalMessagesRead/$remoteMessageQueueSize");
             Log.i(TAG,"Starting to read next Message");
             gatt.readCharacteristic(characteristic);
           }
           else {
             //send a notificaiton if messages destined for this user were received
             //also emit messages to receiver in case they are already in the app
             if(receivedMessagesForUser) {
               sendNotification("You have messages waiting for you","You have received new messages");
               sendMessagesToReceiver(receivedMessages);
             }
             //reset flag
             receivedMessagesForUser = false;

             totalMessagesRead = 0;
             StorageInterface(context).writeMessagesToStorage(
               receivedMessages,
               "savedMessageQueue",
               "savedMessageQueueSizes"
             );
             receivedMessages.clear();

             //start write-back phase to let server know which messages have
             //reached their final destination and can be removed from message queue
             val services = gatt.getServices();

             val messageService : BluetoothGattService? = services.find {
               service -> service.uuid.equals(messageQueueServiceUUID)
             };

             val transferCompleteCharacteristic = messageService?.characteristics?.find {
               currentCharacteristic -> currentCharacteristic.uuid.equals(transferCompleteCharacteristicUUID)
             };

             if(transferCompleteCharacteristic != null) {
               Log.i(TAG,"Transfer complete characteristic found");
               val messagesToAvoid = (deletedMessages as ArrayList<HerdMessage>) +
               (receivedMessagesForSelf as ArrayList<HerdMessage>);

               if(messagesToAvoid.size > 0) {
                 transferCompleteCharacteristic.setValue(messagesToAvoid.get(0)._id.toByteArray());
               }
               else {
                 transferCompleteCharacteristic.setValue("COMPLETE".toByteArray());
                 writebackComplete = true;
               }
               gatt.writeCharacteristic(transferCompleteCharacteristic);
             }
             else {
               Log.i(TAG,"No transferComplete service/characteristic found, removing device and restarting scan");
               gatt.disconnect();
               /* gatt.close(); */
             }
           }
         }
         catch(e : Exception) {
           Log.d(TAG,"Error creating message from parcel : ",e);
           //reset connection variables for next connection
           gatt.disconnect();
           gatt.close();
           totalMessagesRead = 0;
           totalBytes = byteArrayOf();
           messageReadTimeout = false;
           messageTimeoutRegistered = false;
         }
       }
    }

    var writeMessageIndex : Int = 0;
    override fun onCharacteristicWrite(gatt: BluetoothGatt, characteristic: BluetoothGattCharacteristic, status: Int) {
       Log.i(TAG,"Bluetooth GATT Client Callback onCharacteristicWrite");
       if(characteristic.uuid.toString().equals(getString(R.string.transferCompleteCharacteristicUUID))) {
         val messagesToAvoid = (deletedMessages as ArrayList<HerdMessage>) + (receivedMessagesForSelf as ArrayList<HerdMessage>);
         writeMessageIndex += 1;
         if(writeMessageIndex < messagesToAvoid.size) {
           Log.i(TAG,"Writing message id ${writeMessageIndex + 1}/${messagesToAvoid.size}")
           characteristic.setValue(messagesToAvoid.get(writeMessageIndex)._id.toByteArray());
           gatt.writeCharacteristic(characteristic);
         }
         else {
           Log.i(TAG,"Write-back phase complete");
           characteristic.setValue("COMPLETE".toByteArray());
           writebackComplete = true;
           gatt.writeCharacteristic(characteristic);
           writeMessageIndex = 0;
           receivedMessagesForSelf?.clear();
           gatt.disconnect();
           /* gatt.close(); */
         }
       }
    }

    override fun onDescriptorRead(gatt: BluetoothGatt, descriptor: BluetoothGattDescriptor, status: Int) {
        Log.i(TAG,"Bluetooth GATT Client Callback onDescriptorRead, status : $status");
        if(descriptor.getUuid().equals(messageQueueDescriptorUUID)) {
          try {
            //receive remote messageQueue size and start reading messages
            remoteMessageQueueSize = descriptor.getValue().get(0).toInt();
            Log.i(TAG,"Remote Message Queue Size : $remoteMessageQueueSize");
            if(remoteMessageQueueSize > 0) {
              gatt.readCharacteristic(descriptor.getCharacteristic());
            }
            else {
              writebackComplete = true;
              gatt.disconnect();
              /* gatt.close(); */
            }
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
          Log.i(TAG,"No Matching service/characteristic found, disconnecting");
          writebackComplete = true;
          remoteHasReadMessages = true;
          gatt.disconnect();
          /* gatt.close(); */
        }
      }
    }
  }

  var offsetSize : Int = 0;
  var currentPacket : Int = 0;
  var gattClient : BluetoothGatt? = null;
  private val bluetoothGattServerCallback : BluetoothGattServerCallback = object : BluetoothGattServerCallback() {
    override fun onConnectionStateChange(device : BluetoothDevice, status : Int, newState : Int) {
      Log.i(TAG,"Bluetooth GATT Server Callback onConnectionStateChange. Status : " + status + ", STATE : " + when(newState) {
          BluetoothProfile.STATE_DISCONNECTED -> "STATE_DISCONNECTED"
          BluetoothProfile.STATE_DISCONNECTING -> "STATE_DISCONNECTING"
          BluetoothProfile.STATE_CONNECTED -> "STATE_CONNECTED"
          BluetoothProfile.STATE_CONNECTING -> "STATE_CONNECTING"
          else -> "UNKNOWN STATE"
      } + ", Thread : ${Thread.currentThread()}");

      if(newState == BluetoothProfile.STATE_CONNECTED) {
        stopLeScan();
      }
      else if(newState == BluetoothProfile.STATE_DISCONNECTED) {
        /* if(!writebackComplete && status == 0) {
          Log.i(TAG,"GattServerCallback attempting to connect to device as client, address : ${device.getAddress()}, name : ${device.getName()}")
          if(gattClient == null) {
            gattClient = device.connectGatt(
              context,
              false,
              bluetoothGattClientCallback,
              BluetoothDevice.TRANSPORT_LE
            );
          }
        }
        else { */
          Log.i(TAG,"GattServerCallback not attempting to connect to device as client, resetting and scanning")
          currentPacket = 0;
          offsetSize = 0;
          writebackComplete = false;
          remoteHasReadMessages = false;
          gattClient = null;
          scanLeDevice();
        /* } */
      }
    }

    override fun onMtuChanged(device : BluetoothDevice, mtu : Int) {
      Log.i(TAG,"Server Callback onMtuChanged, new mtu : $mtu");
      offsetSize = mtu - 1;
    }

    override fun onCharacteristicReadRequest(device : BluetoothDevice, requestId : Int,
      offset : Int, characteristic : BluetoothGattCharacteristic) {
        Log.i(TAG,"Bluetooth GATT Server Callback onCharacteristicReadRequest, id : $requestId, offset : $offset");
        try {
          if((messageQueue?.size as Int) > messagePointer){
            //increment packet for offset calculation
            currentPacket += 1;
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
              remoteHasReadMessages = true;
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
         Log.i(TAG,"characteristic value size : ${value.size}");
         val messageID : String = String(value);
         Log.i(TAG,"Message ID Received : $messageID")
         if(messageID != "COMPLETE") {
           val message = messageQueue?.find {it -> it._id.equals(messageID)};
           if(message != null) {
             val removed = messageQueue?.remove(message)
             Log.i(TAG,"Message to remove from queue was found in queue, removed : $removed");
             messagesToRemoveFromQueue.add(message);
           }
           gattServer?.sendResponse(device,requestId,0,0,byteArrayOf());
         }
         else {
           Log.i(TAG,"Server message writeback complete");
           //store deleted messages in case service is cancelled before app is opened
           StorageInterface(context).writeMessagesToStorage(
             messagesToRemoveFromQueue,
             "messagesToRemove",
             "messagesToRemoveSizes"
           );

           device.connectGatt(
              context,
              false,
              bluetoothGattClientCallback,
              BluetoothDevice.TRANSPORT_LE
           )
         }
    }

    override fun onDescriptorReadRequest(device : BluetoothDevice, requestId : Int,
      offset : Int, descriptor : BluetoothGattDescriptor) {
        Log.i(TAG,"Bluetooth GATT Server Callback onDescriptorReadRequest");
        if(descriptor.getUuid().equals(messageQueueDescriptorUUID)) {
          gattServer?.sendResponse(
            device,
            requestId,BluetoothGatt.GATT_SUCCESS,
            0,
            byteArrayOf((messageQueue?.size as Int).toByte())
          );
          if((messageQueue?.size as Int) == 0) {
            remoteHasReadMessages = true;
            if(!writebackComplete) {
              Log.i(TAG,"writeback not complete, connecting as client")
              if(gattClient == null) {
                gattClient = device.connectGatt(
                  context,
                  false,
                  bluetoothGattClientCallback,
                  BluetoothDevice.TRANSPORT_LE
                );
              }
            }
            else {
              Log.i(TAG,"writeback and remoteRead complete, scanning for new devices")
              scanLeDevice();
            }
          }
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

  private val leScanCallback: ScanCallback = object : ScanCallback() {

      var gattInstance : BluetoothGatt? = null;
      override fun onScanResult(callbackType: Int, result: ScanResult) {
          super.onScanResult(callbackType, result);
          Log.i(TAG, "BLE Scan Result Callback Invoked")
          //perform actions related to finding a device
          val device : BluetoothDevice = result.getDevice();
          val name = device.getName();
          val address = device.getAddress();
          Log.i(TAG, "device name : " + name);
          Log.i(TAG, "device Address : " + address);
          Log.i(TAG,"Device List Length : " + bleDeviceList.size);

          if(callbackType == ScanSettings.CALLBACK_TYPE_MATCH_LOST) {
            if(bleDeviceList.contains(device)) {
              bleDeviceList.remove(device);
              Log.i(TAG,"Device removed from device list, address : $address, name : $name");
              if(gattInstance != null) {
                gattInstance?.disconnect();
                gattInstance?.close();
              }
            }
          }
          else {
            if(!(bleDeviceList.contains(device))) {
              Log.i(TAG,"Device was not in device list, adding it.");
              bleDeviceList.add(device);
            }
            if(address != null) {
              val remoteDeviceInstance = bluetoothAdapter?.getRemoteDevice(address);
              if(gattInstance != null) {
                gattInstance?.disconnect();
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
  }

  private fun scanLeDevice() {
      Log.i(TAG,"scanLeDevice() called")
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

      if(!bleScanningThreadActive.get()) {
        Log.i(TAG,"ble Scanning thread is not active, starting scanning thread")
        Thread({
          bleScanningThreadActive.set(true);
          //wait 30 seconds before starting scan again after stopping
          while(!allowBleScan && bleScanningThreadActive.get()){};
          //double check service is still running before starting scan
          //as blocking call above could prevent this section from being notified
          if(running && bleScanningThreadActive.get()) {
            try {
              BLEScanner?.startScan(listOf(filter),settings,leScanCallback);
              Log.i(TAG,"BLE Scanning started");
            }
            catch(e : Exception) {
              Log.e(TAG,"Error starting BLE scan",e);
            }
          }
        }).start()
      }
      else {
        Log.i(TAG,"ble scanning thread is already active")
      }
  }
  private val bleScanTimeoutHandler = Handler(Looper.getMainLooper());
  private fun stopLeScan() {
    Log.i(TAG,"stopLeScan() called")
    BLEScanner?.stopScan(leScanCallback);
    bleScanningThreadActive.set(false);
    if(allowBleScan) {
      allowBleScan = false;
      Log.i(TAG,"Waiting 30 seconds before allowing another BLE Scan");
      bleScanTimeoutHandler.removeCallbacksAndMessages(null);
      bleScanTimeoutHandler.postDelayed({
        Log.i(TAG,"30 Second wait over, new BLE Scan now allowed");
        allowBleScan = true;
        },30000)
    }
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
    BLEAdvertiser = bluetoothAdapter?.getBluetoothLeAdvertiser();
    if(BLEAdvertiser != null) {
      BLEAdvertiser?.stopAdvertisingSet(advertisingCallback);
      var useLegacyMode : Boolean = false;
      Log.i(TAG,"Bluetooth LE Advertiser Found");
      // Check if all features are supported
      if (!(bluetoothAdapter?.isLe2MPhySupported() as Boolean)) {
          Log.e(TAG, "2M PHY not supported!");
          useLegacyMode = true;
      }

      //default settings for legacy advertisement
      var advertisingParameters = AdvertisingSetParameters.Builder()
      .setInterval(AdvertisingSetParameters.INTERVAL_LOW)
      .setTxPowerLevel(AdvertisingSetParameters.TX_POWER_LOW)
      .setConnectable(true)
      .setScannable(true)
      .setLegacyMode(true)

      var advertisingData = AdvertiseData.Builder()
      .addServiceUuid(parcelServiceUUID)
      .setIncludeDeviceName(false);

      if (!(bluetoothAdapter?.isLeExtendedAdvertisingSupported() as Boolean)) {
        Log.e(TAG, "LE Extended Advertising not supported!");
        //dont include device name when extended advertising is not supported as only 31 bytes are available
        advertisingData.setIncludeDeviceName(false);
        useLegacyMode = true;
      }

      //override default advertising settings if extended advertising
      //and ble5 PHYs are supported
      if(!useLegacyMode) {
        Log.i(TAG,"Using BLE 5 2MPHY with extended advertising")

        advertisingParameters
        .setLegacyMode(false)
        .setScannable(false)
        .setSecondaryPhy(BluetoothDevice.PHY_LE_2M);

        if(bluetoothAdapter?.isLeCodedPhySupported() as Boolean) {
          Log.i(TAG,"Coded PHY supported, using it")
          advertisingParameters
          .setPrimaryPhy(BluetoothDevice.PHY_LE_CODED)
        }
        else {
          Log.i(TAG,"Coded PHY not supported, using 1M PHY")
          advertisingParameters
          .setPrimaryPhy(BluetoothDevice.PHY_LE_1M)
        }

        advertisingData
        .setIncludeDeviceName(true);
      }

      BLEAdvertiser?.startAdvertisingSet(
        advertisingParameters.build(),
        advertisingData?.build(),
        null,null,null,
        advertisingCallback
      )
    }
  }

  private fun startGATTService() {
    try {
      val service : BluetoothGattService = BluetoothGattService(messageQueueServiceUUID,BluetoothGattService.SERVICE_TYPE_PRIMARY);

      //characteristic through which the message queue will be read
      val messageQueueCharacteristic = BluetoothGattCharacteristic(
        messageQueueCharacteristicUUID,
        BluetoothGattCharacteristic.PROPERTY_READ,
        BluetoothGattCharacteristic.PERMISSION_READ
      );

      //descriptor to show client how many messages are available to be read
      val descriptor : BluetoothGattDescriptor = BluetoothGattDescriptor(
        messageQueueDescriptorUUID,
        BluetoothGattDescriptor.PERMISSION_READ
      );
      messageQueueCharacteristic.addDescriptor(descriptor);

      //back-channel to allow client to inform server of messages which have
      //arrived at their final destination.
      val transferCompleteCharacteristic = BluetoothGattCharacteristic(
        transferCompleteCharacteristicUUID,
        BluetoothGattCharacteristic.PROPERTY_WRITE,
        BluetoothGattCharacteristic.PERMISSION_WRITE,
      )

      service.addCharacteristic(messageQueueCharacteristic);
      service.addCharacteristic(transferCompleteCharacteristic);

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

  public fun addMessagesToDeletedList(messages : ArrayList<HerdMessage>) : Boolean {
    val added : Boolean = deletedMessages?.addAll(messages) as Boolean;
    if(added) {
      Log.i(TAG,"Successfully added messages to deleted list");
    }
    else {
      Log.i(TAG,"Failed to add messages to deleted list")
    }
    return added;
  }

  public fun removeMessage(messages : ArrayList<HerdMessage>) : Boolean {
    val lengthBefore : Int = messageQueue?.size as Int;
    messageQueue = messageQueue?.filter{msg -> messages.find{message -> message._id.equals(msg._id)} == null} as ArrayList<HerdMessage>;
    val lengthAfter : Int = messageQueue?.size as Int;

    //check if deletion was successful
    var deleted : Boolean = (lengthBefore - lengthAfter) == messages.size

    //if deleted message was last message update pointer to prevent OOB error.
    val messageQueueSize : Int = messageQueue?.size as Int
    if(messagePointer >= messageQueueSize) {
      messagePointer = messageQueueSize - 1;
    }

    Log.i(TAG,"Removed ${lengthBefore - lengthAfter} messages from Queue, new size : ${messageQueue?.size}")

    return deleted;
  }

  private fun createCurrentMessageBytes(message : HerdMessage?) {
    val messageParcel : Parcel = Parcel.obtain();
    message?.writeToParcel(messageParcel,0);
    val parcelBytes = messageParcel.marshall();
    currentMessageBytes = parcelBytes;
  }

  private fun createBytesFromMessage(message : HerdMessage?) : ByteArray {
    val messageParcel : Parcel = Parcel.obtain();
    message?.writeToParcel(messageParcel,0);
    val parcelBytes = messageParcel.marshall();
    return parcelBytes;
  }

  private fun createMessageFromBytes(bytes : ByteArray) : HerdMessage {
    //create parcel and custom parcelable from received bytes
    val parcelMessage : Parcel = Parcel.obtain();
    parcelMessage.unmarshall(bytes,0,bytes.size);
    parcelMessage.setDataPosition(0);
    val message : HerdMessage = HerdMessage.CREATOR.createFromParcel(parcelMessage);
    return message;
  }

  public fun getReceivedMessages() : ArrayList<HerdMessage> {
    return receivedMessages;
  }

  public fun getCompletedMessages() : ArrayList<HerdMessage> {
    return messagesToRemoveFromQueue;
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
      Log.i(TAG, "Service onStartCommand " + startId)
      running = true;
      val bundle : Bundle? = intent?.getExtras();
      messageQueue = bundle?.getParcelableArrayList("messageQueue");
      Log.i(TAG,"Queue size on start : ${messageQueue?.size}");
      deletedMessages = bundle?.getParcelableArrayList("deletedMessages");
      receivedMessagesForSelf = bundle?.getParcelableArrayList("receivedMessagesForSelf");
      publicKey = bundle?.getString("publicKey");
      //initialise byte array for sending message
      if((messageQueue?.size as Int) > 0) {
        createCurrentMessageBytes(messageQueue?.get(0))
      }
      /* bluetoothManager = this.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager */
      startGATTService();
      scanLeDevice();
      advertiseLE();
      this.registerReceiver(bluetoothStateReceiver,IntentFilter(BluetoothAdapter.ACTION_STATE_CHANGED));
      this.registerReceiver(locationStateReceiver,IntentFilter("android.location.PROVIDERS_CHANGED"));
      return Service.START_STICKY
    }

  override fun onBind(intent : Intent) : IBinder? {
    Log.i(TAG, "Service onBind")
    return binder;
  }

  override fun onDestroy() {
      Log.i(TAG, "Service onDestroy")
      if(bluetoothAdapter?.isEnabled() as Boolean) {
        stopLeScan()
        BLEAdvertiser?.stopAdvertisingSet(advertisingCallback);
        gattServer?.close();
      }
      this.unregisterReceiver(bluetoothStateReceiver);
      this.unregisterReceiver(locationStateReceiver);
      running = false;
  }
}
