package com.herd

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.BaseActivityEventListener
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.Arguments
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter

import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothProfile
import android.bluetooth.BluetoothDevice
import android.content.Intent
import android.content.Context
import android.content.IntentFilter
import android.content.BroadcastReceiver
import android.app.Activity
import android.Manifest.permission
import androidx.core.content.ContextCompat
import androidx.core.app.ActivityCompat
import android.content.pm.PackageManager
import android.location.LocationManager

class BluetoothModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private final val activityListener = object : BaseActivityEventListener() {
      override fun onActivityResult(activity : Activity, requestCode : Int, resultCode : Int, intent : Intent) {
        //request bluetooth
        if(requestCode == 1) {
          if(resultCode == Activity.RESULT_OK) {
            reactContext.getJSModule(RCTDeviceEventEmitter::class.java)
            .emit("BTEnableResult","ACCEPTED")
          }
          else {
            reactContext.getJSModule(RCTDeviceEventEmitter::class.java)
            .emit("BTEnableResult","DENIED")
          }
        }

        //request make discoverable
        if(requestCode == 2) {
          if(resultCode == Activity.RESULT_OK) {
            reactContext.getJSModule(RCTDeviceEventEmitter::class.java)
            .emit("BTDiscoverableResult","ACCEPTED")
          }
          else {
            reactContext.getJSModule(RCTDeviceEventEmitter::class.java)
            .emit("BTDiscoverableResult","DENIED")
          }
        }
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

                //create object to pass to javascript
                val deviceObject : WritableMap = Arguments.createMap();
                deviceObject.putString("name",deviceName);
                deviceObject.putString("macAddress",deviceHardwareAddress);

                //pass object to JS through event emitter
                reactContext.getJSModule(RCTDeviceEventEmitter::class.java)
                .emit("newBTDeviceFound",deviceObject)
          }
        }
      }
    }

    private val BTStateReceiver = object : BroadcastReceiver() {
      override fun onReceive(context : Context, intent : Intent) {
        val action : String? = intent.action
        when(action) {
          BluetoothAdapter.ACTION_DISCOVERY_STARTED -> {
            reactContext.getJSModule(RCTDeviceEventEmitter::class.java)
            .emit("BTStateChange","DISCOVERY_STARTED")
          }
          BluetoothAdapter.ACTION_DISCOVERY_FINISHED -> {
            reactContext.getJSModule(RCTDeviceEventEmitter::class.java)
            .emit("BTStateChange","DISCOVERY_FINISHED")
          }
        }
      }
    }

    init {
      reactContext.addActivityEventListener(activityListener)
      val BTFilter = IntentFilter(BluetoothDevice.ACTION_FOUND)
      val BTStateFilter = IntentFilter(BluetoothAdapter.ACTION_DISCOVERY_STARTED);
      BTStateFilter.addAction(BluetoothAdapter.ACTION_DISCOVERY_FINISHED);
      reactContext.getApplicationContext().registerReceiver(BTReceiver,BTFilter)
      reactContext.getApplicationContext().registerReceiver(BTStateReceiver,BTStateFilter)
    }

    override fun getName(): String {
        return "BluetoothModule"
    }

    @ReactMethod
    fun scanForDevices(promise : Promise) {
      val adapter : BluetoothAdapter? = BluetoothAdapter.getDefaultAdapter();

      if(adapter === null) {
        promise.reject("No BluetoothAdapter Found");
      }
      else {
        if(adapter.isEnabled()) {
          if(adapter.isDiscovering()) {
            adapter.cancelDiscovery();
          }
          val discoveryStarted = adapter.startDiscovery();
          if(!discoveryStarted) {
            promise.reject("Device Discovery could not be started")
          }
          else {

          }
        }
        else {
          promise.reject("Bluetooth Adapter is disabled")
        }
      }
    }

    @ReactMethod
    fun checkBTEnabled(promise : Promise) {
      val adapter : BluetoothAdapter? = BluetoothAdapter.getDefaultAdapter();

      if(adapter === null) {
        promise.reject("No BluetoothAdapter Found")
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

    @ReactMethod
    fun requestBTEnable(promise : Promise) {
      val adapter : BluetoothAdapter? = BluetoothAdapter.getDefaultAdapter();
      if(adapter === null) {
        promise.reject("No BluetoothAdapter Found")
      }
      else {
        if(!adapter.isEnabled()) {
          val enableBTIntent = Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE)
          val REQUEST_ENABLE_BT = 1
          val activity : Activity? = getReactApplicationContext().getCurrentActivity();
          if(activity !== null) {
            activity.startActivityForResult(enableBTIntent, REQUEST_ENABLE_BT);
            promise.resolve("")
          }
        }
      }
    }

    @ReactMethod
    fun requestBTMakeDiscoverable(duration : Int, promise : Promise) {
      val discoverableIntent: Intent = Intent(BluetoothAdapter.ACTION_REQUEST_DISCOVERABLE).apply {
        putExtra(BluetoothAdapter.EXTRA_DISCOVERABLE_DURATION, duration)
      }
      val activity : Activity? = getReactApplicationContext().getCurrentActivity();
      if(activity === null) {
        promise.reject("Activity is NULL")
      }
      else {
        activity.startActivityForResult(discoverableIntent,2)
        promise.resolve("")
      }
    }

    @ReactMethod
    fun checkLocationPermission(promise : Promise) {
      val backgroundLocationAllowed = ContextCompat.checkSelfPermission(
        getReactApplicationContext(),
        permission.ACCESS_BACKGROUND_LOCATION
      )
      if(backgroundLocationAllowed === PackageManager.PERMISSION_GRANTED) {
        promise.resolve(true)
      }
      else {
        promise.resolve(false)
      }
    }

    @ReactMethod
    fun requestLocationPermissions() {
      val activity : Activity? = getReactApplicationContext().getCurrentActivity();
      if(activity !== null) {
        ActivityCompat.requestPermissions(
          activity,
          arrayOf(permission.ACCESS_BACKGROUND_LOCATION),
          3
        )
      }
    }

    @ReactMethod
    fun checkLocationEnabled(promise : Promise) {
      val lm = getReactApplicationContext().getSystemService(Context.LOCATION_SERVICE) as LocationManager;
      promise.resolve(lm.isLocationEnabled())
    }
}
