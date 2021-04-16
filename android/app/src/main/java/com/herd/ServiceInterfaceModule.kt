package com.herd

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise

import com.herd.HerdBackgroundService

import android.app.Service
import android.content.Intent
import android.content.Context
import android.app.Activity
import android.app.ActivityManager
import android.os.Bundle

class ServiceInterfaceModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  val context = reactContext

  override fun getName(): String {
      return "ServiceInterfaceModule"
  }

  @ReactMethod
  fun enableService() {
    val activity : Activity? = context.getCurrentActivity();
    val serviceIntent : Intent = Intent(activity, HerdBackgroundService::class.java);
    context.startService(serviceIntent);
  }

  @ReactMethod
  fun disableService() {
    val activity : Activity? = context.getCurrentActivity();
    val serviceIntent : Intent = Intent(activity, HerdBackgroundService::class.java);
    context.stopService(serviceIntent);
  }

  @ReactMethod
  fun isRunning() : Boolean {
    return HerdBackgroundService.running;
  }
}
