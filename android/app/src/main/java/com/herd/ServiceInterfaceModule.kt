package com.herd

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;

import com.herd.HerdBackgroundService

import android.app.Service
import android.content.ServiceConnection
import android.content.Intent
import android.content.Context
import android.app.Activity
import android.app.ActivityManager
import android.os.Bundle
import android.os.Parcelable
import android.os.IBinder
import android.util.Log
import kotlinx.parcelize.Parcelize
import java.util.ArrayList
import android.content.ComponentName

@Parcelize
data class HerdMessage(
  val to : String,
  val from : String,
  val text : String,
  val timestamp : Int
) : Parcelable

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
        message.getString("to") as String,
        message.getString("from") as String,
        message.getString("text") as String,
        message.getInt("timestamp")
      )

      if(service.addMessage(msgParcel)) {
        promise.resolve(true);
      } else {
        promise.resolve(false);
      }
    }
  }

  @ReactMethod
  fun removeMessageFromService(messages : ReadableArray, promise : Promise) {
    if(bound) {
      val messagesToDelete : ArrayList<HerdMessage> = ArrayList();
      for(i in 0 until messages.size()) {
        val currentMsg : HerdMessage = HerdMessage(
          messages.getMap(i).getString("to") as String,
          messages.getMap(i).getString("from") as String,
          messages.getMap(i).getString("text") as String,
          messages.getMap(i).getInt("timestamp")
        )
        messagesToDelete.add(currentMsg);
      }
      if(service.removeMessage(messagesToDelete)) {
        promise.resolve(true);
      }
      else {
        promise.resolve(false);
      }
    }
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
