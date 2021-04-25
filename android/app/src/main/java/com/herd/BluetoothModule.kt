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
import android.bluetooth.BluetoothSocket
import android.bluetooth.BluetoothServerSocket
import android.content.Intent
import android.content.Context
import android.content.IntentFilter
import android.content.BroadcastReceiver
import android.app.Activity
import android.Manifest.permission
import androidx.core.content.ContextCompat
import androidx.core.app.ActivityCompat
import androidx.appcompat.app.AlertDialog
import android.content.pm.PackageManager
import android.location.LocationManager
import android.content.DialogInterface
import com.herd.R
import android.provider.Settings
import android.util.Log
import android.os.Handler
import android.os.Looper
import android.os.Message

import java.util.UUID
import java.io.InputStream
import java.io.OutputStream

class BluetoothModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private final val TAG : String = "BluetoothModule";
    val context = reactContext

    private val MESSAGE_READ: Int = 0
    private val MESSAGE_WRITE: Int = 1
    private val MESSAGE_TOAST: Int = 2

    var bluetoothEnabledPromise : Promise? = null;
    var bluetoothDiscoverablePromise : Promise? = null;
    var bluetoothDiscoverableDuration : Int? = null;
    var locationPermissionPromise : Promise? = null;

    override fun getName(): String {
        return "BluetoothModule"
    }

    //anonymous inner function to override class functions
    private final val activityListener = object : BaseActivityEventListener() {
      override fun onActivityResult(activity : Activity, requestCode : Int, resultCode : Int, intent : Intent?) {
        //request bluetooth
        if(requestCode == 1) {
          if(resultCode == Activity.RESULT_OK) {
            bluetoothEnabledPromise?.resolve(true);
          }
          else {
            bluetoothEnabledPromise?.resolve(false);
          }
        }

        //request make discoverable
        if(requestCode == 2) {
          //result code is equal to the requested duration when "yes", RESULT_CANCELLED when "no"
          if(resultCode == bluetoothDiscoverableDuration) {
            bluetoothDiscoverablePromise?.resolve(true);
          }
          else {
            bluetoothDiscoverablePromise?.resolve(false)
          }
        }

        if(requestCode == 3) {
          locationPermissionPromise?.resolve(resultCode)
        }

        bluetoothEnabledPromise = null;
        locationPermissionPromise = null;
      }
    }

    private val BTReceiver = object : BroadcastReceiver() {
      override fun onReceive(context : Context, intent : Intent) {
        val action : String? = intent.action
        when(action) {
          BluetoothDevice.ACTION_FOUND -> {
                // Discovery has found a device. Get the BluetoothDevice
                // object and its info from the Intent.
                val device: BluetoothDevice? =
                        intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE)
                val deviceName = device?.name
                val deviceHardwareAddress = device?.address // MAC address

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

    private val messageHandler = object : Handler(Looper.getMainLooper()) {

      override fun handleMessage(msg : Message) {
        context.getJSModule(RCTDeviceEventEmitter::class.java)
        .emit("NEW_MESSAGE",msg.toString())
      }
    }

    init {
      reactContext.addActivityEventListener(activityListener);
      val BTFilter = IntentFilter(BluetoothDevice.ACTION_FOUND)
      val BTStateFilter = IntentFilter(BluetoothAdapter.ACTION_DISCOVERY_STARTED);
      BTStateFilter.addAction(BluetoothAdapter.ACTION_DISCOVERY_FINISHED);
      reactContext.getApplicationContext().registerReceiver(BTReceiver,BTFilter)
      reactContext.getApplicationContext().registerReceiver(BTStateReceiver,BTStateFilter)
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
            promise.resolve(true);
          }
        }
        else {
          promise.reject("Bluetooth Adapter is disabled")
        }
      }
    }

    @ReactMethod
    fun cancelScanForDevices(promise : Promise) {
      val adapter : BluetoothAdapter? = BluetoothAdapter.getDefaultAdapter();

      if(adapter === null) {
        promise.reject("No BluetoothAdapter Found");
      }
      else {
        if(adapter.isEnabled() && adapter.isDiscovering()) {
          adapter.cancelDiscovery()
        }
        promise.resolve(true);
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
            try {
              bluetoothEnabledPromise = promise;
              activity.startActivityForResult(enableBTIntent, REQUEST_ENABLE_BT);
            }
            catch(e : Exception) {
              promise.reject("Error starting BT Enable Activity",e)
            }
          }
          else {
            promise.reject("Activity is NULL")
          }
        }
      }
    }

    @ReactMethod
    fun requestBTMakeDiscoverable(duration : Int, promise : Promise) {
      bluetoothDiscoverableDuration = duration;

      val discoverableIntent: Intent = Intent(BluetoothAdapter.ACTION_REQUEST_DISCOVERABLE).apply {
        putExtra(BluetoothAdapter.EXTRA_DISCOVERABLE_DURATION, duration)
      }
      val activity : Activity? = getReactApplicationContext().getCurrentActivity();
      if(activity === null) {
        promise.reject("Activity is NULL")
      }
      else {
        bluetoothDiscoverablePromise = promise;
        activity.startActivityForResult(discoverableIntent,2)
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

    @ReactMethod
    fun requestLocationEnable(promise : Promise) {
      val intent = Intent(android.provider.Settings.ACTION_LOCATION_SOURCE_SETTINGS);
      val activity : Activity? = getReactApplicationContext().getCurrentActivity();
      if(activity !== null) {
        activity.startActivityForResult(intent,3);
        locationPermissionPromise = promise
      }
      else {
        promise.reject("Activity is NULL");
      }
    }

    private var connectionThread : BTConnectionThread? = null;

    private inner class createBTServerThread() : Thread() {
      val btUUID = UUID.fromString("acc99392-7f38-11eb-9439-0242ac130002");
      val adapter = BluetoothAdapter.getDefaultAdapter();
      var connectionSocket : BluetoothSocket? = null;

      @Volatile var shouldLoop = true
      public override fun run() {
        val serverSocket : BluetoothServerSocket? = adapter?.listenUsingRfcommWithServiceRecord("herd",btUUID);
        while (shouldLoop) {
            connectionSocket = try {
                serverSocket?.accept()
            } catch (e: Exception) {
                shouldLoop = false
                throw(e);
            }
            connectionSocket?.also {
                /* manageBTServerConnection(it) */
                connectionThread = BTConnectionThread(it, messageHandler)
                connectionThread?.start();
                serverSocket?.close()
                shouldLoop = false
            }
        }
      }

      public fun cancel() {
        connectionSocket?.close();
        shouldLoop = false;
      }

    }

    private inner class createBTClientThread(deviceAddress : String) : Thread() {
      val btUUID = UUID.fromString("acc99392-7f38-11eb-9439-0242ac130002");
      val adapter = BluetoothAdapter.getDefaultAdapter();
      var clientSocket : BluetoothSocket? = null;
      val device = adapter?.getRemoteDevice(deviceAddress);

      public override fun run() {
        // Cancel discovery because it otherwise slows down the connection.
        adapter.cancelDiscovery()
        clientSocket = device?.createRfcommSocketToServiceRecord(btUUID);

        clientSocket?.use { socket ->
          socket.connect();

          //TODO do work with connected socket in seperate thread
          /* manageBTClientConnection(socket); */
          connectionThread = BTConnectionThread(socket, messageHandler);
          connectionThread?.start();
        }
      }

      fun cancel() {
        clientSocket?.close()
      }
    }

    private inner class BTConnectionThread(private val socket : BluetoothSocket, private val handler : Handler) : Thread() {
      private val inputStream : InputStream = socket.inputStream;
      private val outputStream : OutputStream = socket.outputStream;
      private val buffer : ByteArray = ByteArray(1024);

      override fun run() {
          var numBytes: Int;

          // Keep listening to the InputStream until an exception occurs.
          while (true) {
              // Read from the InputStream.
              numBytes = try {
                  inputStream.read(buffer)
              } catch (e: Exception) {
                  Log.d(TAG, "Input stream was disconnected", e)
                  break
              }

              val readMsg = handler.obtainMessage(
                        MESSAGE_READ, numBytes, -1,
                        buffer)
              readMsg.sendToTarget();
          }
      }

      fun write(bytes: ByteArray) {
          try {
              outputStream.write(bytes)
          } catch (e: Exception) {
              Log.e(TAG, "Error occurred when sending data", e)
          }
      }

      fun cancel() {
        try {
          socket.close()
        }
        catch(e : Exception) {
          Log.e(TAG, "Could not close BT connection socket",e)
        }
      }
    }

    @ReactMethod
    fun writeToBTConnection(value : String, promise : Promise) {
      try {
        val stringBytes : ByteArray = value.toByteArray();
        connectionThread?.write(stringBytes);
        promise.resolve(true);
      }
      catch(e : Exception) {
        promise.reject("Error writing to connection",e)
      }
    }

    private fun manageBTServerConnection(socket : BluetoothSocket) {
      val inputStream : InputStream = socket.getInputStream();
      val outputStream : OutputStream = socket.getOutputStream();
    }

    private fun manageBTClientConnection(socket : BluetoothSocket) {
      val inputStream : InputStream = socket.getInputStream();
      val outputStream : OutputStream = socket.getOutputStream();
      Thread {
        var shouldRun = true;
        while(shouldRun) {
          var data : ByteArray = ByteArray(1024);
          inputStream.read(data);
          if(data.size > 0) {
            shouldRun = false;
          }
        }
      }
    }

    private var BTServerThread : createBTServerThread? = null;
    @ReactMethod
    fun listenAsServer(promise : Promise) {
      try {
        BTServerThread = createBTServerThread();
        BTServerThread?.start();
        promise.resolve(true);
      }
      catch(e : Exception) {
        promise.reject("Error creating thread for BT requests",e)
      }
    }

    @ReactMethod
    fun cancelListenAsServer(promise : Promise) {
      try {
        val alive : Boolean? = BTServerThread?.isAlive();
        if(alive != null && alive === true) {
            BTServerThread?.cancel();
        }
        promise.resolve(true);
      }
      catch(e : Exception) {
        promise.reject("Error cancelling server thread",e)
      }
    }

    private var BTClientThread : createBTClientThread? = null

    @ReactMethod
    fun connectAsClient(device : String, promise : Promise) {
      try {
        BTClientThread = createBTClientThread(device);
        promise.resolve(true);
      }
      catch(e : Exception) {
        promise.reject("Error connecting as client",e)
      }
    }

    @ReactMethod
    fun cancelConnectAsClient(promise : Promise) {
      try {
        BTClientThread?.cancel();
        promise.resolve(true);
      }
      catch(e : Exception) {
        promise.reject("Error cancelling BT client thread",e)
      }
    }
}
