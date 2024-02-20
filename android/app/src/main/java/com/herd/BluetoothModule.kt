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
import com.facebook.react.modules.core.PermissionListener
import com.facebook.react.modules.core.PermissionAwareActivity

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
import android.os.Build
import android.net.Uri

import java.util.UUID
import java.io.InputStream
import java.io.OutputStream

class BluetoothModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext), PermissionListener {
    private final val TAG : String = "HerdBluetoothModule";
    val context = reactContext

    private val MESSAGE_READ: Int = 0
    private val MESSAGE_WRITE: Int = 1
    private val MESSAGE_TOAST: Int = 2

    private val BLUETOOTH_ENABLED_PERMISSION_REQUEST_CODE : Int = 1;
    private val BLUETOOTH_DISCOVERABLE_PERMISSION_REQUEST_CODE : Int = 2;
    private val BLUETOOTH_SCAN_PERMISSION_REQUEST_CODE : Int = 3;
    private val LOCATION_ENABLED_REQUEST_CODE : Int = 4;
    private val LOCATION_PERMISSION_REQUEST_CODE : Int = 5;
    private val BLUETOOTH_BACKGROUND_LOCATION_REQUEST_CODE : Int = 6;
    private val NAVIGATE_TO_SETTINGS_REQUEST_CODE : Int = 7;

    var bluetoothEnabledPromise : Promise? = null;
    var bluetoothDiscoverablePromise : Promise? = null;
    var bluetoothDiscoverableDuration : Int? = null;
    var bluetoothScanPermissionPromise : Promise? = null;
    var locationPermissionPromise : Promise? = null;
    var locationEnabledPromise : Promise? = null;
    var navigateToSettingsPromise : Promise? = null;

    private val bluetoothManager = context.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager

    val btUUID = UUID.fromString(context.getString(R.string.BTConnectionUUID));

    override fun getName(): String {
        return "BluetoothModule"
    }

    @ReactMethod
    fun addListener(eventName: String) {
        Log.i(TAG,"addListener called, eventName : $eventName")
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        Log.i(TAG,"removeListeners called, count : $count")
    }

    //anonymous inner function to override class functions
    private final val activityListener = object : BaseActivityEventListener() {
      override fun onActivityResult(activity : Activity, requestCode : Int, resultCode : Int, intent : Intent?) {
        //request bluetooth
        if(requestCode == BLUETOOTH_ENABLED_PERMISSION_REQUEST_CODE) {
          if(resultCode == Activity.RESULT_OK) {
            bluetoothEnabledPromise?.resolve(true);
          }
          else {
            bluetoothEnabledPromise?.resolve(false);
          }
        }

        //request make discoverable
        if(requestCode == BLUETOOTH_DISCOVERABLE_PERMISSION_REQUEST_CODE) {
          //result code is equal to the requested duration when "yes", RESULT_CANCELLED when "no"
          if(resultCode == bluetoothDiscoverableDuration) {
            bluetoothDiscoverablePromise?.resolve(true);
          }
          else {
            bluetoothDiscoverablePromise?.resolve(false)
          }
        }

        if(requestCode == LOCATION_ENABLED_REQUEST_CODE) {
          val granted = resultCode === PackageManager.PERMISSION_GRANTED;
          Log.i(TAG,"location enabled resultCode : $resultCode, granted : $granted")
          locationEnabledPromise?.resolve(granted)
        }

        if(requestCode == NAVIGATE_TO_SETTINGS_REQUEST_CODE) {
          Log.i(TAG,"Navigate to settings request code");
          navigateToSettingsPromise?.resolve(true);
          navigateToSettingsPromise = null;
        }

        bluetoothEnabledPromise = null;
        locationEnabledPromise = null;
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
              if(deviceName.contains("_HERD")) {
                Log.i(TAG,"Device containing '_HERD' found, emitting device to JS")
                //create object to pass to javascript
                val deviceObject : WritableMap = Arguments.createMap();
                deviceObject.putString("name",deviceName.replace("_HERD",""));
                deviceObject.putString("macAddress",deviceHardwareAddress);

                //pass object to JS through event emitter
                reactContext.getJSModule(RCTDeviceEventEmitter::class.java)
                .emit("newBTDeviceFound",deviceObject)
              }
              else {
                Log.i(TAG,"Device found, doesn't contain '_HERD' in name, not emitting")
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
            .emit("BTStateChange","DISCOVERY_STARTED")
          }
          BluetoothAdapter.ACTION_DISCOVERY_FINISHED -> {
            val adapter = bluetoothManager.getAdapter();
            adapter.setName(adapter.getName().replace("_HERD",""));
            reactContext.getJSModule(RCTDeviceEventEmitter::class.java)
            .emit("BTStateChange","DISCOVERY_FINISHED")
          }
        }
      }
    }

    private val BTScanModeReceiver = object : BroadcastReceiver() {
      override fun onReceive(context : Context, intent : Intent) {
        val action : String? = intent.action;
        Log.d(TAG,"BTScanModeReceiver received action $action");
        val scanMode = intent.getIntExtra(BluetoothAdapter.EXTRA_SCAN_MODE,0);
        if(scanMode != 0) {
          var scanModeString = "Unknown scan mode";
          when(scanMode) {
            BluetoothAdapter.SCAN_MODE_NONE -> scanModeString = "SCAN_MODE_NONE";
            BluetoothAdapter.SCAN_MODE_CONNECTABLE -> scanModeString = "SCAN_MDOE_CONNECTABLE";
            BluetoothAdapter.SCAN_MODE_CONNECTABLE_DISCOVERABLE -> scanModeString = "SCAN_MODE_CONNECTABLE_DISCOVERABLE";
          }
          Log.d(TAG,"BTScanModeReceiver scanMode : $scanModeString($scanMode)");
        }
        else {
          Log.d(TAG,"Getting intent from scanMode action resulted in default value $scanMode");
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
      val BTScanModeFilter = IntentFilter(BluetoothAdapter.ACTION_SCAN_MODE_CHANGED);

      reactContext.getApplicationContext().registerReceiver(BTReceiver,BTFilter);
      reactContext.getApplicationContext().registerReceiver(BTStateReceiver,BTStateFilter);
      reactContext.getApplicationContext().registerReceiver(BTScanModeReceiver,BTScanModeFilter);
    }

    fun checkPermissionsGranted(permissions : List<String>) : Boolean {
      val context = getReactApplicationContext();
      for(permission in permissions) {
        val granted = ContextCompat.checkSelfPermission(
          context,
          permission
        ) === PackageManager.PERMISSION_GRANTED;
        if (!granted) return false;
      }
      return true;
    }

    override fun onRequestPermissionsResult(requestCode: Int,permissions: Array<String>,grantResults: IntArray) : Boolean {
      for(i in 0..(permissions.size -1)) {
        Log.i(TAG,"Permission : ${permissions.get(i)}, result : ${grantResults.get(i)}")
      }
      if(requestCode == BLUETOOTH_BACKGROUND_LOCATION_REQUEST_CODE) {
        Log.i(TAG,"access background location request")
        if(grantResults.get(0) == PackageManager.PERMISSION_GRANTED) {
          Log.i(TAG,"Background location request granted, requestin coarse and fine location access")
          val activity : PermissionAwareActivity = getReactApplicationContext().getCurrentActivity() as PermissionAwareActivity
          activity.requestPermissions(
            arrayOf(permission.ACCESS_COARSE_LOCATION,permission.ACCESS_FINE_LOCATION),
            LOCATION_PERMISSION_REQUEST_CODE,
            this
          )
        }
        else {
          Log.i(TAG,"access background location permission request denied")
          locationPermissionPromise?.resolve(false);
          locationPermissionPromise = null;
        }
      }
      if(requestCode == LOCATION_PERMISSION_REQUEST_CODE) {
        Log.i(TAG,"onRequestPermissionsResult location permission request code");
        var allLocationPermissionsGranted = true;
        for(item in grantResults) {
          if(item != PackageManager.PERMISSION_GRANTED) {
            allLocationPermissionsGranted = false;
          }
        }
        Log.i(TAG,"All Location Permissions granted : $allLocationPermissionsGranted")
        locationPermissionPromise?.resolve(allLocationPermissionsGranted);
        locationPermissionPromise = null;
      }
      else if(requestCode == BLUETOOTH_SCAN_PERMISSION_REQUEST_CODE) {
        Log.i(TAG,"onRequestPermissionsResult bluetooth scan permission request code");
        var allBluetoothScanPermissionsGranted = true;
        for(item in grantResults) {
          if(item != PackageManager.PERMISSION_GRANTED) {
            allBluetoothScanPermissionsGranted = false;
          }
        }
        Log.i(TAG,"All Bluetooth Scan Permissions granted : $allBluetoothScanPermissionsGranted")
        bluetoothScanPermissionPromise?.resolve(allBluetoothScanPermissionsGranted);
      }
      bluetoothScanPermissionPromise = null;
      return true;
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
          adapter?.setName(originalAdapterName + "_HERD");
          val discoveryStarted = adapter.startDiscovery();
          if(!discoveryStarted) {
            adapter?.setName(adapter.getName().replace("_HERD",""));
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
      val adapter : BluetoothAdapter? = bluetoothManager.getAdapter();
      adapter?.setName(adapter.getName().replace("_HERD",""));
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

      if(adapter === null) {
        promise.resolve(false);
      }
      else {
        promise.resolve(true);
      }
    }

    @ReactMethod
    fun requestBTPermissions(promise : Promise) {
      if(Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        val activity : PermissionAwareActivity = getReactApplicationContext().getCurrentActivity() as PermissionAwareActivity
        if(activity !== null) {
          bluetoothScanPermissionPromise = promise;
          activity.requestPermissions(
            arrayOf(permission.BLUETOOTH_SCAN,permission.BLUETOOTH_CONNECT,permission.BLUETOOTH_ADVERTISE),
            BLUETOOTH_SCAN_PERMISSION_REQUEST_CODE,
            this
          )
        }
      }
      else {
        promise.resolve(true)
      }
    }

    @ReactMethod
    fun checkBTPermissions(promise : Promise) {
      if(Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        val permissions = listOf(
          permission.BLUETOOTH_SCAN,
          permission.BLUETOOTH_CONNECT,
          permission.BLUETOOTH_ADVERTISE
        );
        promise.resolve(checkPermissionsGranted(permissions));
      }
      else {
        promise.resolve(true)
      }
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
        activity.startActivityForResult(discoverableIntent,BLUETOOTH_DISCOVERABLE_PERMISSION_REQUEST_CODE)
      }
    }

    @ReactMethod
    fun checkLocationPermission(promise : Promise) {
      val permissions = listOf(
        permission.ACCESS_BACKGROUND_LOCATION,
        permission.ACCESS_FINE_LOCATION
      )
      promise.resolve(checkPermissionsGranted(permissions));
    }

    @ReactMethod
    fun requestLocationPermissions(promise : Promise) {
      val activity : PermissionAwareActivity = getReactApplicationContext().getCurrentActivity() as PermissionAwareActivity
      if(activity !== null) {
        locationPermissionPromise = promise;
        activity.requestPermissions(
          arrayOf(permission.ACCESS_BACKGROUND_LOCATION),
          BLUETOOTH_BACKGROUND_LOCATION_REQUEST_CODE,
          this
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
        activity.startActivityForResult(intent,LOCATION_ENABLED_REQUEST_CODE);
        locationEnabledPromise = promise
      }
      else {
        promise.reject("Activity is NULL");
      }
    }

    @ReactMethod
    fun navigateToApplicationSettings(promise : Promise) {
      val activity : Activity? = getReactApplicationContext().getCurrentActivity();
      val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
      val uri = Uri.fromParts("package", activity?.getPackageName(), null);
      intent.setData(uri);
      activity?.startActivityForResult(intent,NAVIGATE_TO_SETTINGS_REQUEST_CODE);
      navigateToSettingsPromise = promise;
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
              connectionThread = BTConnectionThread(it, messageHandler)
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
        Log.d(TAG, "Bluetooth Client Thread was started")
        // Cancel discovery because it otherwise slows down the connection.
        adapter.cancelDiscovery()

        clientSocket?.let { socket ->
          try {
            socket.connect();
            if(socket.isConnected()) {
              Log.d(TAG, "Bluetooth client socket connected")
              connectionThread = BTConnectionThread(socket, messageHandler);
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

    private inner class BTConnectionThread(private val socket : BluetoothSocket, private val handler : Handler) : Thread() {
      private val inputStream : InputStream = socket.inputStream;
      private val outputStream : OutputStream = socket.outputStream;
      private val buffer : ByteArray = ByteArray(8192);
      private var shouldRun : Boolean = true;
      override fun run() {
          Log.d(TAG, "Bluetooth Connection Thread Started")

          context.getJSModule(RCTDeviceEventEmitter::class.java)
          .emit("BTConnectionStateChange","Connected")

          var numBytes: Int;
          // Keep listening to the InputStream until an exception occurs.
          while (shouldRun) {
              if(!socket.isConnected()) {
                Log.e(TAG,"BT Connection Thread bluetooth socket is no longer connected")
                context.getJSModule(RCTDeviceEventEmitter::class.java)
                .emit("newBTMessageReceived","Disconnected");
                
                shouldRun = false;
                this.cancel();
              }
              else {
                // Read from the InputStream.
                numBytes = try {
                    inputStream.read(buffer);
                } catch (e: Exception) {
                    Log.d(TAG, "Input stream was disconnected", e)
                    break
                }

                //get string from byte array
                val receivedString : String = String(buffer.copyOfRange(0,numBytes));
                Log.d(TAG, "Received message over BT Connection : " + receivedString);

                //emit string upwards to javscript event listener
                context.getJSModule(RCTDeviceEventEmitter::class.java)
                .emit("newBTMessageReceived",receivedString);

                val readMsg = handler.obtainMessage(
                          MESSAGE_READ, numBytes, -1,
                          buffer)
                readMsg.sendToTarget();
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
