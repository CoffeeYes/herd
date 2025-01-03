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

import android.app.Service
import android.content.ServiceConnection
import android.content.Intent
import android.content.Context
import android.app.Activity
import android.app.ActivityManager
import android.os.Bundle
import android.os.Parcelable
import android.os.Parcel
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

/* @Parcelize */
class HerdMessage(
  val _id : String,
  val to : String,
  val from : String,
  val text : String,
  val timestamp : Long
) : Parcelable {
  companion object {
    @JvmField
    val CREATOR = object : Parcelable.Creator<HerdMessage> {
      override fun createFromParcel(parcel : Parcel) : HerdMessage {
        return HerdMessage(parcel);
      }

      override fun newArray(size: Int) = arrayOfNulls<HerdMessage>(size)
    }
  }

  private constructor(parcel: Parcel) : this(
        _id = parcel.readString() as String,
        to = parcel.readString() as String,
        from = parcel.readString() as String,
        text = parcel.readString() as String,
        timestamp = parcel.readLong()
  )
  override fun writeToParcel(parcel: Parcel, flags: Int) {
      for(entry in listOf(_id,to,from,text)) {
        parcel.writeString(entry)
      }
      parcel.writeLong(timestamp)
  }

  override fun describeContents() = 0
}

class ServiceInterfaceModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  val context = reactContext;
  private final val TAG = "HerdServiceInterface";
  private lateinit var service : HerdBackgroundService;
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
      if(action == "com.herd.NEW_HERD_MESSAGE_RECEIVED") {
        emitterString = "newHerdMessagesReceived";
      }
      else if(action == "com.herd.REMOVE_MESSAGES_FROM_QUEUE") {
        emitterString = "removeMessagesFromQueue"
      }
      if(messages != null && messages.size > 0 && emitterString.length > 0) {
        Log.i(TAG,"emitting messages to JS side with emitterString : ${emitterString}")
        val messageArray = createArrayFromMessages(messages);
        //pass object to JS through event emitter
        reactContext.getJSModule(RCTDeviceEventEmitter::class.java)
        .emit(emitterString,messageArray);
      }
    }
  }
    
  private val errorNotificationTitle = "Herd has stopped sending messages in the background";
  private var errorNotificationText = "";
  private var errorNotificationType = "";
  private var errorNotificationID : Int = 0;
  private final val locationAndBTStateReceiver = object : BroadcastReceiver() {
    override fun onReceive(context : Context, intent : Intent) {
      val action : String? = intent.action;
      var errorOccurred : Boolean = false;
      when(action) {
        BluetoothAdapter.ACTION_STATE_CHANGED -> {
          val state = intent.getIntExtra(
            BluetoothAdapter.EXTRA_STATE,
            BluetoothAdapter.ERROR
          );
          if (state == BluetoothAdapter.STATE_OFF) {
            errorOccurred = true;
            errorNotificationText = "because bluetooth was turned off";
            errorNotificationType = "ADAPTER_TURNED_OFF";
          }
        }
        "android.location.PROVIDERS_CHANGED" -> {
          val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager;
          if(!locationManager.isLocationEnabled()) {
            errorOccurred = true;
            errorNotificationText = "because location was turned off" 
            errorNotificationType = "LOCATION_DISABLED";
          }
        }
      }
      if(errorOccurred) {
        if(HerdBackgroundService.running) {
          if(notificationIsPending(errorNotificationID)) {
            service.sendNotification(
              errorNotificationTitle,
              errorNotificationText,
              errorNotificationID
            )
          }
          else {
            errorNotificationID = service.sendNotification(
              errorNotificationTitle,
              errorNotificationText
            )
          }
          service.stopRunning();
        }
        reactContext.getJSModule(RCTDeviceEventEmitter::class.java)
        .emit("bluetoothOrLocationStateChange",errorNotificationType);
      }
    }
  }

  override fun getName(): String {
      return "ServiceInterfaceModule"
  }

  @ReactMethod
  fun addListener(eventName: String) {
      Log.i(TAG,"addListener called, eventName : $eventName")
  }

  @ReactMethod
  fun removeListeners(count: Int) {
      Log.i(TAG,"removeListeners called, count : $count")
  }

  fun createMessageFromObject(messageObject : ReadableMap) : HerdMessage {
    val message : HerdMessage = HerdMessage(
      messageObject.getString("_id") as String,
      messageObject.getString("to") as String,
      messageObject.getString("from") as String,
      messageObject.getString("text") as String,
      //getDouble is the only way to get a long from JS as it is not natively supported in JS
      messageObject.getDouble("timestamp").toLong()
    )
    return message;
  }

  fun createObjectFromMessage(message : HerdMessage) : WritableMap {
    val messageObject : WritableMap = Arguments.createMap();
    messageObject.putString("_id",message._id);
    messageObject.putString("to",message.to);
    messageObject.putString("from",message.from);
    messageObject.putString("text",message.text);
    //cast int to double to get 64 bit "long" in JS as JS doesnt support longs
    messageObject.putDouble("timestamp",message.timestamp.toDouble());
    return messageObject;
  }

  fun createMessagesFromArray(messageArray : ReadableArray) : ArrayList<HerdMessage> {
    val messages : ArrayList<HerdMessage> = ArrayList();
    for(i in 0 until messageArray.size()) {
      val currentMessageObject : HerdMessage = createMessageFromObject(messageArray.getMap(i));
      messages.add(currentMessageObject);
    }
    return messages;
  }

  fun createArrayFromMessages(herdMessages : ArrayList<HerdMessage>) : WritableArray {
    var messages : WritableArray = Arguments.createArray();
    try {
      for(message in herdMessages) {
        val newMessage : WritableMap = createObjectFromMessage(message);
        messages.pushMap(newMessage)
      }
    }
    catch(e : Exception) {
      Log.e(TAG,"Error parsing herd messages",e);
    }
    return messages;
  }

  @ReactMethod
  fun enableService(
    messageQueue : ReadableArray,
    receivedMessagesForSelf : ReadableArray,
    deletedReceivedMessages : ReadableArray,
    publicKey : String) {
      val msgQ : ArrayList<HerdMessage> = createMessagesFromArray(messageQueue);
      val deletedMessages = createMessagesFromArray(deletedReceivedMessages);
      val receivedMessages = createMessagesFromArray(receivedMessagesForSelf);
      val activity : Activity? = context.getCurrentActivity();
      val serviceIntent : Intent = Intent(activity, HerdBackgroundService::class.java);
      serviceIntent.putExtra("messageQueue",msgQ);
      serviceIntent.putExtra("publicKey",publicKey);
      serviceIntent.putExtra("deletedMessages",deletedMessages);
      serviceIntent.putExtra("receivedMessagesForSelf",receivedMessages);
      val messageIntentFilter = IntentFilter("com.herd.NEW_HERD_MESSAGE_RECEIVED");
      messageIntentFilter.addAction("com.herd.REMOVE_MESSAGES_FROM_QUEUE");
      context.registerReceiver(messageReceiver,messageIntentFilter);
      context.startService(serviceIntent);
      context.bindService(serviceIntent,serviceConnection,Context.BIND_AUTO_CREATE);
  }

  @ReactMethod
  fun addMessageToService(message : ReadableMap,promise : Promise) {
    if(bound) {
      val msgParcel : HerdMessage = createMessageFromObject(message);
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
      promise.resolve(service.removeMessage(nativeMessageIDs));
    }
    else {
      promise.resolve(false);
    }
  }

  @ReactMethod
  fun addDeletedMessagesToService(messages : ReadableArray, promise : Promise) {
    var success : Boolean = false;
    if(bound) {
      val msgArray : ArrayList<HerdMessage> = createMessagesFromArray(messages);
      success = service.addMessagesToDeletedList(msgArray);
    }
    promise.resolve(success);
  }

  @ReactMethod
  fun getMessages(name : String, promise : Promise) {
    var messages : WritableArray = Arguments.createArray();
    if(bound) {
      var herdMessages = ArrayList<HerdMessage>();
      if(name === "received") {
        herdMessages = service.getReceivedMessages();
      }
      else if(name === "completed") {
        herdMessages = service.getCompletedMessages();
      }
      messages = createArrayFromMessages(herdMessages);
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
    val messages : WritableArray = createArrayFromMessages(cachedMessages)
    promise.resolve(messages);
    storageInterface.deleteStoredMessages(messageFilename,sizesFilename);
  }

  @ReactMethod
  fun disableService() {
    val activity : Activity? = context.getCurrentActivity();
    val serviceIntent : Intent = Intent(activity, HerdBackgroundService::class.java);
    try {
      context.unbindService(serviceConnection);
      context.stopService(serviceIntent);
    }
    catch(e : Exception) {
      Log.e(TAG,"Error unbinding and stopping service service : $e")
    }
    try {
      context.unregisterReceiver(messageReceiver);
      context.unregisterReceiver(locationAndBTStateReceiver);
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
  fun notificationIsPending(notificationID : Int, promise : Promise ?= null) : Boolean {
    val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    for(notification in notificationManager.activeNotifications) {
        if (notification.id == notificationID) {
          promise?.resolve(true);
          return true;
        }
     }
     promise?.resolve(false);
     return false;
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
  fun isRunning(promise : Promise) {
    promise.resolve(HerdBackgroundService.running);
  }

  init {
    val bluetoothLocationFilter = IntentFilter(BluetoothAdapter.ACTION_STATE_CHANGED);
    bluetoothLocationFilter.addAction("android.location.PROVIDERS_CHANGED")
    context.registerReceiver(locationAndBTStateReceiver,bluetoothLocationFilter);
  }
}
