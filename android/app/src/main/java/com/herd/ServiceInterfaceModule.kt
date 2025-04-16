package com.herd

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter

import com.herd.HerdBackgroundService
import com.herd.StorageInterface
import com.herd.HerdMessage

import android.app.Service
import android.content.ServiceConnection
import android.content.Intent
import android.content.Context
import android.app.Activity
import android.app.ActivityManager
import android.os.Bundle
import android.os.IBinder
import android.util.Log
import kotlinx.parcelize.Parcelize
import java.util.ArrayList
import android.content.ComponentName
import android.content.BroadcastReceiver
import android.content.IntentFilter

import android.bluetooth.BluetoothAdapter
import android.location.LocationManager
import android.app.NotificationManager

class ServiceInterfaceModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  val context = reactContext;
  private final val TAG = "HerdServiceInterface";
  private lateinit var service : HerdBackgroundService;

  object storageStrings {
    val SAVED_MESSAGE_QUEUE = "savedMessageQueue";
    val SAVED_MESSAGE_QUEUE_SIZES = "savedMessageQueueSizes";
    val MESSAGES_TO_REMOVE = "messagesToRemove";
    val MESSAGES_TO_REMOVE_SIZES = "messagesToRemoveSizes";
  }

  private final val storageStringMap : Map<String,String> = mapOf(
    "SAVED_MESSAGE_QUEUE" to storageStrings.SAVED_MESSAGE_QUEUE,
    "SAVED_MESSAGE_QUEUE_SIZES" to storageStrings.SAVED_MESSAGE_QUEUE_SIZES,
    "MESSAGES_TO_REMOVE" to storageStrings.MESSAGES_TO_REMOVE,
    "MESSAGES_TO_REMOVE_SIZES" to storageStrings.MESSAGES_TO_REMOVE_SIZES
  )

  object bluetoothErrorStrings {
    val LOCATION_DISABLED = "LOCATION_DISABLED";
    val ADAPTER_TURNED_OFF = "ADAPTER_TURNED_OFF";
  }

  private final val bluetoothErrorStringMap : Map<String,String> = mapOf(
    "LOCATION_DISABLED" to bluetoothErrorStrings.LOCATION_DISABLED,
    "ADAPTER_TURNED_OFF" to bluetoothErrorStrings.ADAPTER_TURNED_OFF
  )

  object emitterStrings {
    val NEW_MESSAGES_RECEIVED = "newHerdMessagesReceived";
    val REMOVE_MESSAGES_FROM_QUEUE = "removeMessagesFromQueue";
    val BLUETOOTH_LOCATION_STATE_CHANGE = "bluetoothOrLocationStateChange";
  }

  private final val emitterStringMap : Map<String,String> = mapOf(
    "NEW_MESSAGES_RECEIVED" to emitterStrings.NEW_MESSAGES_RECEIVED,
    "REMOVE_MESSAGES_FROM_QUEUE" to emitterStrings.REMOVE_MESSAGES_FROM_QUEUE,
    "BLUETOOTH_LOCATION_STATE_CHANGE" to emitterStrings.BLUETOOTH_LOCATION_STATE_CHANGE
  )

  private var bound : Boolean = false;

  var serviceConnection = object : ServiceConnection {
    override fun onServiceConnected(name : ComponentName, binder : IBinder) {
      Log.i(TAG,"Service Connected");
      val tempBinder = binder as HerdBackgroundService.LocalBinder;
      service = tempBinder.getService();
      bound = true;
    }

    override fun onServiceDisconnected(name : ComponentName) {
      Log.i(TAG,"Service disconnected");
      bound = false;
    }
  }

  private final val messageReceiver = object : BroadcastReceiver() {
    override fun onReceive(context : Context, intent : Intent) {
      val action : String? = intent.action;
      val bundle : Bundle? = intent.getExtras();
      val messages : ArrayList<HerdMessage>? = bundle?.getParcelableArrayList("messages");
      Log.i(TAG,"Received ${messages?.size} new messages in messageReceiver");
      var emitterString : String = "";
      if(action == HerdBackgroundService.newMessageReceivedEmitterString) {
        emitterString = emitterStrings.NEW_MESSAGES_RECEIVED;
      }
      else if(action == HerdBackgroundService.removeMessagesFromQueueEmitterString) {
        emitterString = emitterStrings.REMOVE_MESSAGES_FROM_QUEUE;
      }
      if(messages != null && messages.size > 0 && emitterString.length > 0) {
        Log.i(TAG,"emitting messages to JS side with emitterString : ${emitterString}")
        val messageArray = HerdMessage.toWritableArray(messages);
        //pass object to JS through event emitter
        reactContext.getJSModule(RCTDeviceEventEmitter::class.java)
        .emit(emitterString,messageArray);
      }
    }
  }
    
  private final val locationAndBTStateReceiver = object : BroadcastReceiver() {
    override fun onReceive(context : Context, intent : Intent) {
      val errorNotificationType = HerdBackgroundService.checkForBluetoothOrLocationError(context, intent);
      if(errorNotificationType.length > 0) {
        reactContext.getJSModule(RCTDeviceEventEmitter::class.java)
        .emit(emitterStrings.BLUETOOTH_LOCATION_STATE_CHANGE,errorNotificationType);
        
        if(bound) {
          unbindService();
        }
      }
    }
  }

  override fun getName(): String {
      return "ServiceInterfaceModule"
  }

  override fun getConstants() : Map<String, Any> {
    return mapOf(
      "emitterStrings" to emitterStringMap,
      "storage" to storageStringMap,
      "bluetoothErrors" to bluetoothErrorStringMap
    )
  }

  @ReactMethod
  fun addListener(eventName: String) {
      Log.i(TAG,"addListener called, eventName : $eventName")
  }

  @ReactMethod
  fun removeListeners(count: Int) {
      Log.i(TAG,"removeListeners called, count : $count")
  }

  @ReactMethod
  fun enableService(
    messageQueue : ReadableArray,
    receivedMessagesForSelf : ReadableArray,
    deletedReceivedMessages : ReadableArray,
    publicKey : String,
    allowNotifications : Boolean) {
      val msgQ : ArrayList<HerdMessage> = HerdMessage.toArrayList(messageQueue);
      val deletedMessages = HerdMessage.toArrayList(deletedReceivedMessages);
      val receivedMessages = HerdMessage.toArrayList(receivedMessagesForSelf);
      val activity : Activity? = context.getCurrentActivity();
      val serviceIntent : Intent = Intent(activity, HerdBackgroundService::class.java);
      serviceIntent.putExtra("messageQueue",msgQ);
      serviceIntent.putExtra("publicKey",publicKey);
      serviceIntent.putExtra("deletedMessages",deletedMessages);
      serviceIntent.putExtra("receivedMessagesForSelf",receivedMessages);
      serviceIntent.putExtra("allowNotifications",allowNotifications);
      val messageIntentFilter = IntentFilter(HerdBackgroundService.newMessageReceivedEmitterString);
      messageIntentFilter.addAction(HerdBackgroundService.removeMessagesFromQueueEmitterString);
      context.registerReceiver(messageReceiver,messageIntentFilter);
      context.startService(serviceIntent);
      context.bindService(serviceIntent,serviceConnection,Context.BIND_AUTO_CREATE);
  }

  @ReactMethod
  fun addMessageToService(message : ReadableMap,promise : Promise) {
    if(bound) {
      val msgParcel = HerdMessage(message);
      promise.resolve(service.addMessageToQueue(msgParcel))
    }
    else {
      promise.resolve(false);
    }
  }

  @ReactMethod
  fun removeMessagesFromService(messageIDs : ReadableArray, promise : Promise) {
    if(bound) {
      val nativeMessageIDs : ArrayList<String> = messageIDs.toArrayList() as ArrayList<String>;
      promise.resolve(service.removeMessages(nativeMessageIDs));
    }
    else {
      promise.resolve(false);
    }
  }

  @ReactMethod
  fun addDeletedMessagesToService(messages : ReadableArray, promise : Promise) {
    var success : Boolean = false;
    if(bound) {
      val msgArray : ArrayList<HerdMessage> = HerdMessage.toArrayList(messages);
      success = service.addMessagesToDeletedList(msgArray);
    }
    promise.resolve(success);
  }

  @ReactMethod
  fun getMessages(name : String, promise : Promise) {
    var messages : WritableArray = Arguments.createArray();
    if(bound) {
      var herdMessages = ArrayList<HerdMessage>();
      if(name == "received") {
        herdMessages = service.getReceivedMessages();
      }
      else if(name == "completed") {
        herdMessages = service.getCompletedMessages();
      }
      messages = HerdMessage.toWritableArray(herdMessages);
    }
    promise.resolve(messages);
  }

  @ReactMethod
  fun getStoredMessages(messageFilename : String, sizesFilename : String, promise : Promise) {
    val storageInterface = StorageInterface(context.getApplicationContext());
    val cachedMessages : ArrayList<HerdMessage> = storageInterface.readMessagesFromStorage(
      messageFilename,
      sizesFilename
    );
    val messages : WritableArray = HerdMessage.toWritableArray(cachedMessages)
    promise.resolve(messages);
    storageInterface.deleteStoredMessages(messageFilename,sizesFilename);
  }

  @ReactMethod
  fun unbindService() {
    try {
      context.unbindService(serviceConnection);
      bound = false;
    }
    catch(e : Exception) {
      Log.e(TAG,"Error unbinding service : $e")
    }
  }

  @ReactMethod
  fun disableService() {
    val activity : Activity? = context.getCurrentActivity();
    val serviceIntent : Intent = Intent(activity, HerdBackgroundService::class.java);
    unbindService();
    try {
      context.stopService(serviceIntent);
    }
    catch(e : Exception) {
      Log.e(TAG,"Error stopping service : $e")
    }
    try {
      context.unregisterReceiver(messageReceiver);
    }
    catch(e : Exception) {
      Log.e(TAG,"error unregistering broadcastReceivers : $e")
    }
    bound = false;
  }

  @ReactMethod
  fun sendNotification(title : String, text : String, promise : Promise) {
    if(HerdBackgroundService.running) {
      val notificationID = service.sendNotification(title,text);
      promise.resolve(notificationID);
    }
    else {
      promise.resolve(null);
    }
  }

  @ReactMethod
  fun notificationIsPending(notificationID : Int, promise : Promise) {
    promise.resolve(service.notificationIsPending(notificationID));
  }

  //we must register/unregister receiver with frontend mount/unmount as there is no
  //functional counterpart to init() in kotlin which would allow us to unregister the
  //receiver on object destruction.
  @ReactMethod
  fun setFrontendRunning(running : Boolean) {
    if(HerdBackgroundService.running) {
      service.setFrontendRunning(running);
    }
    if(running) {
      val bluetoothLocationFilter = IntentFilter(BluetoothAdapter.ACTION_STATE_CHANGED);
      bluetoothLocationFilter.addAction("android.location.PROVIDERS_CHANGED")
      context.registerReceiver(locationAndBTStateReceiver,bluetoothLocationFilter);
    }
    else {
      context.unregisterReceiver(locationAndBTStateReceiver);
    }
  }

  @ReactMethod
  fun setAllowNotifications(allow : Boolean) {
    if(HerdBackgroundService.running) {
      service.setAllowNotifications(allow);
    }
  }

  @ReactMethod
  fun notificationsAreEnabled(promise : Promise) {
    val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    promise.resolve(notificationManager.areNotificationsEnabled());
  }

  @ReactMethod
  fun updateNotification(title : String, text : String, notificationID : Int) {
    service.sendNotification(title,text,notificationID);
  }

  @ReactMethod
  fun isBound(promise : Promise) {
    promise.resolve(bound);
  }

  @ReactMethod
  fun isRunning(promise : Promise) {
    promise.resolve(HerdBackgroundService.running);
  }
}
