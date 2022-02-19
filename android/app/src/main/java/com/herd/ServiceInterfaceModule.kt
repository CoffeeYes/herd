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
  val timestamp : Int
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
        timestamp = parcel.readInt()
  )
  override fun writeToParcel(parcel: Parcel, flags: Int) {
      parcel.writeString(_id)
      parcel.writeString(to)
      parcel.writeString(from)
      parcel.writeString(text)
      parcel.writeInt(timestamp)
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

  @ReactMethod
  fun enableService(messageQueue : ReadableArray) {
    val msgQ : ArrayList<HerdMessage> = ArrayList();
    for(i in 0 until messageQueue.size()) {
      val currentMsg : HerdMessage = HerdMessage(
        messageQueue.getMap(i).getString("_id") as String,
        messageQueue.getMap(i).getString("to") as String,
        messageQueue.getMap(i).getString("from") as String,
        messageQueue.getMap(i).getString("text") as String,
        messageQueue.getMap(i).getInt("timestamp")
      )
      msgQ.add(currentMsg);
    }
    /* Log.i(TAG,"TEST : " + messageQueue.getMap(0).getString("to")); */
    val activity : Activity? = context.getCurrentActivity();
    val serviceIntent : Intent = Intent(activity, HerdBackgroundService::class.java);
    serviceIntent.putExtra("messageQueue",msgQ);
    context.startService(serviceIntent);
    context.bindService(serviceIntent,serviceConnection,Context.BIND_AUTO_CREATE);
  }

  @ReactMethod
  fun addMessageToService(message : ReadableMap,promise : Promise) {
    if(bound) {
      val msgParcel : HerdMessage = HerdMessage(
        message.getString("_id") as String,
        message.getString("to") as String,
        message.getString("from") as String,
        message.getString("text") as String,
        message.getInt("timestamp")
      )
      promise.resolve(service.addMessage(msgParcel))
    }
    else {
      promise.resolve(false);
    }
  }

  @ReactMethod
  fun removeMessagesFromService(messages : ReadableArray, promise : Promise) {
    if(bound) {
      val messagesToDelete : ArrayList<HerdMessage> = ArrayList();
      for(i in 0 until messages.size()) {
        val currentMsg : HerdMessage = HerdMessage(
          messages.getMap(i).getString("_id") as String,
          messages.getMap(i).getString("to") as String,
          messages.getMap(i).getString("from") as String,
          messages.getMap(i).getString("text") as String,
          messages.getMap(i).getInt("timestamp")
        )
        messagesToDelete.add(currentMsg);
      }
      promise.resolve(service.removeMessage(messagesToDelete))
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
      for(message in herdMessages) {
        /* val newMessage = mapOf(
          "_id" to message._id,
          "to" to message.to,
          "from" to message.from,
          "text" to message.text,
          "timestamp" to message.timestamp
        ) as ReadableMap */
        val newMessage : WritableMap = Arguments.createMap();
        newMessage.putString("_id",message._id);
        newMessage.putString("to",message.to);
        newMessage.putString("from",message.from);
        newMessage.putString("text",message.text);
        newMessage.putInt("timestamp",message.timestamp);
        messages.pushMap(newMessage)
      }
    }
    promise.resolve(messages);
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
