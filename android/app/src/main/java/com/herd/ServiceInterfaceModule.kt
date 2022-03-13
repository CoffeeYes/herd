package com.herd

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.Arguments

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
      parcel.writeString(_id)
      parcel.writeString(to)
      parcel.writeString(from)
      parcel.writeString(text)
      parcel.writeLong(timestamp)
  }

  override fun describeContents() = 0
}

class ServiceInterfaceModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  val context = reactContext;
  private final val TAG = "ServiceInterfaceModule";
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

  override fun getName(): String {
      return "ServiceInterfaceModule"
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
  fun enableService(messageQueue : ReadableArray, deletedReceivedMessages : ReadableArray, publicKey : String) {
    val msgQ : ArrayList<HerdMessage> = createMessagesFromArray(messageQueue);
    val deletedMessages = createMessagesFromArray(deletedReceivedMessages);
    val activity : Activity? = context.getCurrentActivity();
    val serviceIntent : Intent = Intent(activity, HerdBackgroundService::class.java);
    serviceIntent.putExtra("messageQueue",msgQ);
    serviceIntent.putExtra("publicKey",publicKey);
    serviceIntent.putExtra("deletedMessages",deletedMessages);
    context.startService(serviceIntent);
    context.bindService(serviceIntent,serviceConnection,Context.BIND_AUTO_CREATE);
  }

  @ReactMethod
  fun addMessageToService(message : ReadableMap,promise : Promise) {
    if(bound) {
      val msgParcel : HerdMessage = createMessageFromObject(message);
      promise.resolve(service.addMessage(msgParcel))
    }
    else {
      promise.resolve(false);
    }
  }

  @ReactMethod
  fun removeMessagesFromService(messages : ReadableArray, promise : Promise) {
    if(bound) {
      val messagesToDelete : ArrayList<HerdMessage> = createMessagesFromArray(messages);
      promise.resolve(service.removeMessage(messagesToDelete));
    }
    else {
      promise.resolve(false);
    }
  }

  @ReactMethod
  fun getReceivedMessages(promise : Promise) {
    var messages : WritableArray = Arguments.createArray();
    if(bound) {
      val herdMessages : ArrayList<HerdMessage> = service.getReceivedMessages();
      messages = createArrayFromMessages(herdMessages);
    }
    promise.resolve(messages);
  }

  @ReactMethod
  fun getStoredMessages(promise : Promise) {
    val storageInterface = StorageInterface(context.getApplicationContext());
    val cachedMessages : ArrayList<HerdMessage> = storageInterface.readMessageQueueFromStorage();
    val messages : WritableArray = createArrayFromMessages(cachedMessages);
    promise.resolve(messages);
    storageInterface.deleteStoredMessages();
  }

  @ReactMethod
  fun disableService() {
    val activity : Activity? = context.getCurrentActivity();
    val serviceIntent : Intent = Intent(activity, HerdBackgroundService::class.java);
    context.unbindService(serviceConnection);
    context.stopService(serviceIntent);
    bound = false;
  }

  @ReactMethod
  fun isRunning(promise : Promise) {
    promise.resolve(HerdBackgroundService.running);
  }
}
