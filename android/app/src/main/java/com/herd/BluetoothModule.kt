package com.herd


import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise

import android.bluetooth.BluetoothAdapter

class BluetoothModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String {
        return "BluetoothModule"
    }

    @ReactMethod
    fun scanForDevices(promise : Promise) {
      val adapter : BluetoothAdapter? = BluetoothAdapter.getDefaultAdapter();

      if(adapter !== null) {
        promise.resolve("Adapter found");
      }
      else {
        promise.resolve("No Bluetooth Adapter found");
      }
    }
}
