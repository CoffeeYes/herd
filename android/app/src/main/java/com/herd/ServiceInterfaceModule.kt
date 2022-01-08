package com.herd

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;

import com.herd.HerdBackgroundService

import android.app.Service
import android.content.Intent
import android.content.Context
import android.app.Activity
import android.app.ActivityManager
import android.os.Bundle
import android.os.Parcelable
import android.util.Log
import kotlinx.parcelize.Parcelize
import java.util.ArrayList

class ServiceInterfaceModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  val context = reactContext
  private final val TAG = "ServiceInterfaceModule"

  override fun getName(): String {
      return "ServiceInterfaceModule"
  }

  @Parcelize
  class HerdMessage(
    val to : String,
    val from : String,
    val text : String,
    val timestamp : Int
  ) : Parcelable

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
  }

  @ReactMethod
  fun disableService() {
    val activity : Activity? = context.getCurrentActivity();
    val serviceIntent : Intent = Intent(activity, HerdBackgroundService::class.java);
    context.stopService(serviceIntent);
  }

  @ReactMethod
  fun isRunning(promise : Promise) {
    promise.resolve(HerdBackgroundService.running);
  }
}
