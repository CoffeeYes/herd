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
import android.bluetooth.BluetoothManager
import android.content.Intent
import android.content.Context
import android.content.IntentFilter
import android.content.BroadcastReceiver
import android.app.Activity
import android.Manifest.permission
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
import android.os.Build
import android.net.Uri

import java.util.UUID
import java.io.InputStream
import java.io.OutputStream

class BluetoothModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private final val TAG : String = "HerdBluetoothModule";
    val context = reactContext

    private val BLUETOOTH_ENABLED_PERMISSION_REQUEST_CODE : Int = 1;
    private val BLUETOOTH_DISCOVERABLE_REQUEST_CODE : Int = 2;

    private final val herdDeviceIdentifier = "_HERD";

    var bluetoothEnabledPromise : Promise? = null;
    var bluetoothDiscoverablePromise : Promise? = null;
    var bluetoothDiscoverableDuration : Int? = null;

    private val bluetoothManager = context.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager

    val btUUID = UUID.fromString(context.getString(R.string.BTConnectionUUID));

    object emitterStrings {
      val NEW_BT_DEVICE = "newBTDeviceFound";
      val DISCOVERY_STATE_CHANGE = "BTStateChange";
      val CONNECTION_STATE_CHANGE = "BTConnectionStateChange";
      val NEW_MESSAGE = "newBTMessageReceived";
    }

    private final val emitterStringMap : Map<String,String> = mapOf(
      "NEW_BT_DEVICE" to emitterStrings.NEW_BT_DEVICE,
      "DISCOVERY_STATE_CHANGE" to emitterStrings.DISCOVERY_STATE_CHANGE,
      "CONNECTION_STATE_CHANGE" to emitterStrings.CONNECTION_STATE_CHANGE,
      "NEW_MESSAGE" to emitterStrings.NEW_MESSAGE
    )

    override fun getName(): String {
        return "BluetoothModule"
    }

    override fun getConstants() : Map<String,Map<String,String>> {
      return mapOf(
        "emitterStrings" to emitterStringMap
      )
    }

    @ReactMethod
    fun addListener(listenerName: String) {
        Log.i(TAG,"addListener called, eventName : $listenerName")
    }

    @ReactMethod
    fun removeListeners(listenerCount: Int) {
        Log.i(TAG,"removeListeners called, count : $listenerCount")
    }

    private fun resetAdapterName() {
      val adapter : BluetoothAdapter? = bluetoothManager.getAdapter();
      adapter?.setName(adapter.getName().replace(herdDeviceIdentifier,""));
    }

    //anonymous inner function to override class functions
    private final val activityListener = object : BaseActivityEventListener() {
      override fun onActivityResult(activity : Activity, requestCode : Int, resultCode : Int, intent : Intent?) {
        //request bluetooth
        if(requestCode == BLUETOOTH_ENABLED_PERMISSION_REQUEST_CODE) {
          bluetoothEnabledPromise?.resolve(resultCode == Activity.RESULT_OK);
          bluetoothEnabledPromise = null;
        }

        //request make discoverable
        if(requestCode == BLUETOOTH_DISCOVERABLE_REQUEST_CODE) {
          //result code is equal to the requested duration when "yes", RESULT_CANCELLED when "no"
          bluetoothDiscoverablePromise?.resolve(resultCode == bluetoothDiscoverableDuration);
          bluetoothDiscoverablePromise = null;
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
            val device: BluetoothDevice? =
                    intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE)
            val deviceName = device?.name
            val deviceHardwareAddress = device?.address // MAC address
            if(deviceName != null) {
              if(deviceName.contains(herdDeviceIdentifier)) {
                Log.i(TAG,"Device containing '$herdDeviceIdentifier' found, emitting device to JS")
                //create object to pass to javascript
                val deviceObject : WritableMap = Arguments.createMap();
                deviceObject.putString("name",deviceName.replace(herdDeviceIdentifier,""));
                deviceObject.putString("macAddress",deviceHardwareAddress);

                //pass object to JS through event emitter
                reactContext.getJSModule(RCTDeviceEventEmitter::class.java)
                .emit(emitterStrings.NEW_BT_DEVICE,deviceObject)
              }
              else {
                Log.i(TAG,"Device found, doesn't contain '$herdDeviceIdentifier' in name, not emitting")
              }
            }
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
            .emit(emitterStrings.DISCOVERY_STATE_CHANGE,"DISCOVERY_STARTED")
          }
          BluetoothAdapter.ACTION_DISCOVERY_FINISHED -> {
            resetAdapterName();
            reactContext.getJSModule(RCTDeviceEventEmitter::class.java)
            .emit(emitterStrings.DISCOVERY_STATE_CHANGE,"DISCOVERY_FINISHED")
          }
        }
      }
    }

    private final val scanModeStrings = mapOf(
      BluetoothAdapter.SCAN_MODE_NONE to "SCAN_MODE_NONE",
      BluetoothAdapter.SCAN_MODE_CONNECTABLE to "SCAN_MODE_CONNECTABLE",
      BluetoothAdapter.SCAN_MODE_CONNECTABLE_DISCOVERABLE to "SCAN_MODE_CONNECTABLE_DISCOVERABLE",
    )
    
    private val BTScanModeReceiver = object : BroadcastReceiver() {
      override fun onReceive(context : Context, intent : Intent) {
        val action : String? = intent.action;
        Log.d(TAG,"BTScanModeReceiver received action $action");
        val scanMode = intent.getIntExtra(BluetoothAdapter.EXTRA_SCAN_MODE,0);
        val scanModeString = scanModeStrings.getOrDefault(scanMode, "Unkown scan mode");
        Log.d(TAG,"BTScanModeReceiver scanMode : $scanModeString($scanMode)");
        val isDiscoverable = scanMode == BluetoothAdapter.SCAN_MODE_CONNECTABLE_DISCOVERABLE
        if(!isDiscoverable) {
          resetAdapterName();
        }
      }
    }

    @ReactMethod
    fun checkBTDiscoverable(promise : Promise) {
      val bluetoothAdapter = bluetoothManager.getAdapter();
      val scanMode = bluetoothAdapter?.getScanMode();
      promise.resolve(scanMode == BluetoothAdapter.SCAN_MODE_CONNECTABLE_DISCOVERABLE);
    }

    init {
      reactContext.addActivityEventListener(activityListener);
      val BTFilter = IntentFilter(BluetoothDevice.ACTION_FOUND)
      val BTStateFilter = IntentFilter(BluetoothAdapter.ACTION_DISCOVERY_STARTED);
      BTStateFilter.addAction(BluetoothAdapter.ACTION_DISCOVERY_FINISHED);
      val BTScanModeFilter = IntentFilter(BluetoothAdapter.ACTION_SCAN_MODE_CHANGED);

      reactContext.getApplicationContext().registerReceiver(BTReceiver,BTFilter);
      reactContext.getApplicationContext().registerReceiver(BTStateReceiver,BTStateFilter);
      reactContext.getApplicationContext().registerReceiver(BTScanModeReceiver,BTScanModeFilter);
    }

    @ReactMethod
    fun scanForDevices(promise : Promise) {
      val adapter : BluetoothAdapter? = bluetoothManager.getAdapter();

      if(adapter === null) {
        promise.reject("No BluetoothAdapter Found");
      }
      else {
        if(adapter.isEnabled()) {
          if(adapter.isDiscovering()) {
            adapter.cancelDiscovery();
          }
          val originalAdapterName = bluetoothManager.getAdapter().getName();
          adapter.setName(originalAdapterName + herdDeviceIdentifier);
          val discoveryStarted = adapter.startDiscovery();
          if(!discoveryStarted) {
            resetAdapterName();
            promise.resolve(false);
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
      val adapter = bluetoothManager.getAdapter();
      if(adapter === null) {
        promise.reject("No BluetoothAdapter Found");
      }
      else {
        if(adapter.isEnabled() && adapter.isDiscovering()) {
          adapter.cancelDiscovery()
        }
        resetAdapterName();
        promise.resolve(true);
      }
    }

    @ReactMethod
    fun checkBTEnabled(promise : Promise) {
      val adapter : BluetoothAdapter? = bluetoothManager.getAdapter();

      if(adapter === null) {
        promise.reject("No BluetoothAdapter Found")
      }
      else {
        promise.resolve(adapter.isEnabled())
      }
    }

    @ReactMethod
    fun checkForBTAdapter(promise : Promise) {
      val adapter : BluetoothAdapter? = bluetoothManager.getAdapter();
      promise.resolve(adapter !== null);
    }

    @ReactMethod
    fun requestBTEnable(promise : Promise) {
      val adapter : BluetoothAdapter? = bluetoothManager.getAdapter();
      if(adapter === null) {
        promise.reject("No BluetoothAdapter Found")
      }
      else {
        if(!adapter.isEnabled()) {
          val enableBTIntent = Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE)
          val activity : Activity? = getReactApplicationContext().getCurrentActivity();
          if(activity !== null) {
            try {
              bluetoothEnabledPromise = promise;
              activity.startActivityForResult(enableBTIntent, BLUETOOTH_ENABLED_PERMISSION_REQUEST_CODE);
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
        activity.startActivityForResult(discoverableIntent,BLUETOOTH_DISCOVERABLE_REQUEST_CODE);
      }
    }

    @ReactMethod
    fun checkLocationEnabled(promise : Promise) {
      val lm = getReactApplicationContext().getSystemService(Context.LOCATION_SERVICE) as LocationManager;
      promise.resolve(lm.isLocationEnabled())
    }

    private var connectionThread : BTConnectionThread? = null;

    private inner class createBTServerThread() : Thread() {
      val adapter = bluetoothManager.getAdapter();
      var connectionSocket : BluetoothSocket? = null;
      
      private val serverSocket : BluetoothServerSocket? by lazy(LazyThreadSafetyMode.NONE) {
        adapter?.listenUsingRfcommWithServiceRecord("herd",btUUID);
      }

      @Volatile var shouldLoop = true
      public override fun run() {
        Log.d(TAG, "Bluetooth Server Thread Was Started")
        if(adapter != null && !adapter.isEnabled()) {
          Log.d(TAG, "Bluetooth adapter was disabled when attempting to start BT Server Thread");
          throw Exception("Adapter is not enabled");
        }
        while (shouldLoop) {
          Log.i(TAG,"BT Server thread is running")
          connectionSocket = try {
              serverSocket?.accept()
          } catch (e: Exception) {
              Log.d(TAG, "Accepting Bluetooth Socket Failed")
              shouldLoop = false
              null
          }
          connectionSocket?.also {
              Log.d(TAG, "SERVER SOCKET WAS CONNECTED")
              connectionThread = BTConnectionThread(it)
              connectionThread?.start();
              serverSocket?.close()
              shouldLoop = false
          }
        }
      }

      public fun cancel() {
        try {
          serverSocket?.close();
        }
        catch(e : Exception) {
          Log.d(TAG,"Error closing Bluetooth Server Socket when calling cancel() on BTServerThread",e)
        }
      }

    }

    private inner class createBTClientThread(deviceAddress : String) : Thread() {
      val adapter = bluetoothManager.getAdapter();
      val device = adapter?.getRemoteDevice(deviceAddress);

      private val clientSocket: BluetoothSocket? by lazy(LazyThreadSafetyMode.NONE) {
        device?.createRfcommSocketToServiceRecord(btUUID)
      }

      public override fun run() {
        if(adapter != null && !adapter.isEnabled()) {
          Log.d(TAG, "Bluetooth adapter was disabled when attempting to start BT client Thread");
          throw Exception("Bluetooth adapter is disabled");
        }
        Log.d(TAG, "Bluetooth Client Thread was started")
        // Cancel discovery because it otherwise slows down the connection.
        adapter.cancelDiscovery()

        clientSocket?.let { socket ->
          try {
            socket.connect();
            if(socket.isConnected()) {
              Log.d(TAG, "Bluetooth client socket connected")
              connectionThread = BTConnectionThread(socket);
              connectionThread?.start();
            }
            else {
              Log.d(TAG, "Bluetooth client socket could not connect");
              return;
            }
          }
          catch(e : Exception) {
            Log.e(TAG, "Error Connecting Bluetooth Client socket", e);
          }
        }
      }

      fun cancel() {
        try {
          clientSocket?.close();
          Log.d(TAG,"Bluetooth Client Thread was cancelled")
        }
        catch(e : Exception) {
          Log.e(TAG, "Could not close client socket when cancelling BT client thread")
        }
      }
    }

    private inner class BTConnectionThread(private val socket : BluetoothSocket) : Thread() {
      private val inputStream : InputStream = socket.inputStream;
      private val outputStream : OutputStream = socket.outputStream;
      private val buffer : ByteArray = ByteArray(8192);
      private var shouldRun : Boolean = true;
      override fun run() {
          Log.d(TAG, "Bluetooth Connection Thread Started")

          var numBytes: Int;
          // Keep listening to the InputStream until an exception occurs.
          while (shouldRun) {
              if(!socket.isConnected()) {
                Log.e(TAG,"BT Connection Thread bluetooth socket is no longer connected")
                context.getJSModule(RCTDeviceEventEmitter::class.java)
                .emit(emitterStrings.NEW_MESSAGE,"Disconnected");
                
                shouldRun = false;
                this.cancel();
              }
              else {
                context.getJSModule(RCTDeviceEventEmitter::class.java)
                .emit(emitterStrings.CONNECTION_STATE_CHANGE,"Connected")
                // Read from the InputStream.
                numBytes = try {
                    inputStream.read(buffer);
                } catch (e: Exception) {
                    Log.d(TAG, "Input stream was disconnected", e);

                    context.getJSModule(RCTDeviceEventEmitter::class.java)
                    .emit(emitterStrings.CONNECTION_STATE_CHANGE,"Disconnected");

                    break;
                }

                //get string from byte array
                val receivedString : String = String(buffer.copyOfRange(0,numBytes));
                Log.d(TAG, "Received message over BT Connection : " + receivedString);

                //emit string upwards to javscript event listener
                context.getJSModule(RCTDeviceEventEmitter::class.java)
                .emit(emitterStrings.NEW_MESSAGE,receivedString);
              }
          }
          Log.i(TAG,"BTConnectionThread shouldRun is false, returning");
          return;
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
          socket.close();
        }
        catch(e : Exception) {
          Log.e(TAG, "could not close socket in BT connection thread",e)
        }
        finally {
          context.getJSModule(RCTDeviceEventEmitter::class.java)
          .emit(emitterStrings.CONNECTION_STATE_CHANGE,"Disconnected")
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

    @ReactMethod
    fun cancelBTConnectionThread() {
      try {
        connectionThread?.cancel();
      }
      catch(e : Exception) {
        Log.e(TAG, "Error cancelling bluetooth connection thread", e)
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
        if(alive != null && alive) {
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
        BTClientThread?.start();
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
