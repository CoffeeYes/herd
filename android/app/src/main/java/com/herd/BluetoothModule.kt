package com.herd


import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.BaseActivityEventListener

import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothProfile
import android.bluetooth.BluetoothDevice
import android.content.Intent
import android.content.Context
import android.content.IntentFilter 
import android.content.BroadcastReceiver
import android.app.Activity

class BluetoothModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private final val activityListener = object : BaseActivityEventListener() {
      override fun onActivityResult(activity : Activity, requestCode : Int, resultCode : Int, intent : Intent) {

      }
    }

    private val BTReceiver = object : BroadcastReceiver() {
      override fun onReceive(context : Context, intent : Intent) {
        val action : String? = intent.action
        when(action) {
          BluetoothDevice.ACTION_FOUND -> {
                // Discovery has found a device. Get the BluetoothDevice
                // object and its info from the Intent.
                val device: BluetoothDevice =
                        intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE)
                val deviceName = device.name
                val deviceHardwareAddress = device.address // MAC address
          }
        }
      }
    }

    init {
      reactContext.addActivityEventListener(activityListener)
      val BTFilter = IntentFilter(BluetoothDevice.ACTION_FOUND)
      reactContext.getApplicationContext().registerReceiver(BTReceiver,BTFilter)
    }

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
          else {

          }
        }
        else {
          throw Exception("Bluetooth Adapter is disabled")
        }
      }
    }

    @ReactMethod
    fun checkBTEnabled(promise : Promise) {
      val adapter : BluetoothAdapter? = BluetoothAdapter.getDefaultAdapter();

      if(adapter === null) {
        throw Exception("No BluetoothAdapter Found")
      }
      else {
        if(adapter.isEnabled()) {
          promise.resolve(true);
        }
        else {
          promise.resolve(false);
        }
      }
    }

    @ReactMethod
    fun checkForBTAdapter(promise : Promise) {
      val adapter : BluetoothAdapter? = BluetoothAdapter.getDefaultAdapter();

      if(adapter === null) {
        promise.resolve(false);
      }
      else {
        promise.resolve(true);
      }
    }
}
