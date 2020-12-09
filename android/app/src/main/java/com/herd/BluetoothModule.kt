package com.herd


import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise

import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothProfile

class BluetoothModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String {
        return "BluetoothModule"
    }

    @ReactMethod
    fun scanForDevices(promise : Promise) {
      val adapter : BluetoothAdapter? = BluetoothAdapter.getDefaultAdapter();

      if(adapter === null) {
        throw Exception("No BluetoothAdapter Found")
      }
      else {
        if(adapter.isEnabled()) {
          val discoveryStarted = adapter.startDiscovery();
          if(!discoveryStarted) {
            throw Exception("Device Discovery could not be started")
          }
        }
        else {
          throw Exception("Bluetooth Adapter is disabled")
        }
      }
    }
}
