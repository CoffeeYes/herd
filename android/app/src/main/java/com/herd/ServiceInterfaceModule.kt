package com.herd

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise

import com.herd.HerdBackgroundService

class ServiceInterfaceModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String {
      return "ServiceInterfaceModule"
  }

  @ReactMethod
  fun enableService() {

  }

  @ReactMethod
  fun disableService() {
    
  }
}
