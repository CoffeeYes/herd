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

import android.bluetooth.BluetoothGatt
import android.bluetooth.BluetoothGattCallback
import android.bluetooth.BluetoothGattServerCallback
import android.bluetooth.BluetoothGattService
import android.bluetooth.BluetoothGattCharacteristic
import android.bluetooth.BluetoothGattServer

import android.bluetooth.le.BluetoothLeAdvertiser
import android.bluetooth.le.BluetoothLeScanner 
import android.bluetooth.le.AdvertiseData
import android.bluetooth.le.AdvertisingSetParameters
import android.bluetooth.le.AdvertisingSetCallback
import android.bluetooth.le.AdvertisingSet 

import android.bluetooth.le.ScanCallback
import android.bluetooth.le.ScanResult
import android.bluetooth.le.ScanFilter
import android.bluetooth.le.ScanSettings

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
import android.os.ParcelUuid
import android.net.Uri

import android.util.Base64

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

    private val peripheralScanServiceUUID = UUID.fromString(context.getString(R.string.blePeripheralScanServiceUUID));
    private val peripheralScanServiceParcelUUID = ParcelUuid(peripheralScanServiceUUID);

    private val publicKeyCharacteristicUUID = UUID.fromString(context.getString(R.string.blePeripheralPublicKeyCharacteristicUUID));
    private val userDataServiceUUID = UUID.fromString(context.getString(R.string.blePeripheralUserDataServiceUUID));

    val btUUID = UUID.fromString(context.getString(R.string.BTConnectionUUID));

    object emitterStrings {
      val NEW_BT_DEVICE = "newBTDeviceFound";
      val DISCOVERY_STATE_CHANGE = "BTStateChange";
      val CONNECTION_STATE_CHANGE = "BTConnectionStateChange";
      val NEW_DATA_FROM_CONNECTION = "BTNewDataFromConnection";
    }

    private final val emitterStringMap : Map<String,String> = mapOf(
      "NEW_BT_DEVICE" to emitterStrings.NEW_BT_DEVICE,
      "DISCOVERY_STATE_CHANGE" to emitterStrings.DISCOVERY_STATE_CHANGE,
      "CONNECTION_STATE_CHANGE" to emitterStrings.CONNECTION_STATE_CHANGE,
      "NEW_DATA_FROM_CONNECTION" to emitterStrings.NEW_DATA_FROM_CONNECTION
    )

    private final val bluetoothDiscoveryEventsMap : Map<String,String> = mapOf(
      "DISCOVERY_STARTED" to BluetoothAdapter.ACTION_DISCOVERY_STARTED,
      "DISCOVERY_FINISHED" to BluetoothAdapter.ACTION_DISCOVERY_FINISHED
    )
    
    object bluetoothStates {
      val STATE_CONNECTED = "STATE_CONNECTED";
      val STATE_DISCONNECTED = "STATE_DISCONNECTED";
    }

    private final val bluetoothStateMap : Map<String,String> = mapOf(
      "STATE_CONNECTED" to bluetoothStates.STATE_CONNECTED,
      "STATE_DISCONNECTED" to bluetoothStates.STATE_DISCONNECTED
    )

    override fun getName(): String {
        return "BluetoothModule"
    }

    override fun getConstants() : Map<String,Map<String,String>> {
      return mapOf(
        "emitterStrings" to emitterStringMap,
        "discoveryEvents" to bluetoothDiscoveryEventsMap,
        "bluetoothStates" to bluetoothStateMap
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
                deviceObject.putString("identifier",deviceHardwareAddress);

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
        if(action != null) {
          reactContext.getJSModule(RCTDeviceEventEmitter::class.java)
          .emit(emitterStrings.DISCOVERY_STATE_CHANGE,action)
        }
        if(action == BluetoothAdapter.ACTION_DISCOVERY_FINISHED) {
          resetAdapterName();
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

    private var bleDeviceList : MutableMap<String,BluetoothDevice> = mutableMapOf();
    private val leScanCallback: ScanCallback = object : ScanCallback() {
        override fun onScanResult(callbackType: Int, result: ScanResult) {
            super.onScanResult(callbackType, result);
            Log.i(TAG, "BLE Scan Result Callback Invoked")
            //perform actions related to finding a device
            val device : BluetoothDevice = result.getDevice();
            val name = device.getName();
            val address = device.getAddress();
            Log.i(TAG, "device name : " + name);
            Log.i(TAG, "device Address : " + address);
            //create object to pass to javascript
            val deviceName = device?.name ?: "N/A"
            val deviceHardwareAddress = device?.address // MAC address
            if(deviceHardwareAddress != null) {
              Log.i(TAG, "device using blePeripheralServiceUUID found, emitting device to JS")
              val deviceObject : WritableMap = Arguments.createMap();
              deviceObject.putString("name",deviceName);
              deviceObject.putString("identifier",deviceHardwareAddress);

              bleDeviceList.put(deviceHardwareAddress,device);

              //pass object to JS through event emitter
              reactContext.getJSModule(RCTDeviceEventEmitter::class.java)
              .emit(emitterStrings.NEW_BT_DEVICE,deviceObject)
            }
        }
    }
    
    private var bleScanning = false;
    private var bleScanner : BluetoothLeScanner? = null;
    private fun scanForBLEPeripheral() {
      val bluetoothAdapter = bluetoothManager.getAdapter();

      val filter = ScanFilter.Builder()
      .setServiceUuid(peripheralScanServiceParcelUUID)
      .build()

      val settings = ScanSettings.Builder()
      .setScanMode(ScanSettings.SCAN_MODE_LOW_POWER)
      .setCallbackType(ScanSettings.CALLBACK_TYPE_FIRST_MATCH or ScanSettings.CALLBACK_TYPE_MATCH_LOST)
      .setMatchMode(ScanSettings.MATCH_MODE_STICKY)
      .setPhy(ScanSettings.PHY_LE_ALL_SUPPORTED)
      .build()

      bleScanner = bluetoothAdapter?.getBluetoothLeScanner();
      
      val handler = Handler();
      if(!bleScanning) {
        bleScanner?.startScan(listOf(filter),settings,leScanCallback);
        bleScanning = true;
        handler.postDelayed({
            bleScanner?.stopScan(leScanCallback)
            bleScanning = false
        }, 30000)
      }
    }

    private val advertisingCallback : AdvertisingSetCallback = object : AdvertisingSetCallback() {
      override fun onAdvertisingSetStarted(advertisingSet : AdvertisingSet?, txPower : Int, status : Int) {
        Log.i(TAG, "onAdvertisingSetStarted(): txPower:" + txPower + " , status: $status");
      }

      override fun onAdvertisingDataSet(advertisingSet : AdvertisingSet?, status : Int) {
        Log.i(TAG, "onAdvertisingDataSet() : status: $status");
      }

      override fun onScanResponseDataSet(advertisingSet : AdvertisingSet?,status : Int) {
        Log.i(TAG, "onScanResponseDataSet(): status: $status");
      }

      override fun onAdvertisingSetStopped(advertisingSet : AdvertisingSet?) {
        Log.i(TAG, "onAdvertisingSetStopped()");
      }
    };

    private fun advertiseLE() {
      val bluetoothAdapter = bluetoothManager.getAdapter();
      //https://source.android.com/devices/bluetooth/ble_advertising
      val bleAdvertiser = bluetoothAdapter?.getBluetoothLeAdvertiser();
      if(bleAdvertiser != null) {
        bleAdvertiser?.stopAdvertisingSet(advertisingCallback);
        var useLegacyMode : Boolean = false;
        Log.i(TAG,"Bluetooth LE Advertiser Found");
        // Check if all features are supported
        if (!(bluetoothAdapter?.isLe2MPhySupported() as Boolean)) {
            Log.e(TAG, "2M PHY not supported!");
            useLegacyMode = true;
        }

        //default settings for legacy advertisement
        var advertisingParameters = AdvertisingSetParameters.Builder()
        .setInterval(AdvertisingSetParameters.INTERVAL_LOW)
        .setTxPowerLevel(AdvertisingSetParameters.TX_POWER_LOW)
        .setConnectable(true)
        .setScannable(true)
        .setLegacyMode(true)

        var advertisingData = AdvertiseData.Builder()
        .addServiceUuid(peripheralScanServiceParcelUUID)
        .setIncludeDeviceName(false);

        if (!(bluetoothAdapter?.isLeExtendedAdvertisingSupported() as Boolean)) {
          Log.e(TAG, "LE Extended Advertising not supported!");
          //dont include device name when extended advertising is not supported as only 31 bytes are available
          advertisingData.setIncludeDeviceName(false);
          useLegacyMode = true;
        }

        //override default advertising settings if extended advertising
        //and ble5 PHYs are supported
        if(!useLegacyMode) {
          Log.i(TAG,"Using BLE 5 2MPHY with extended advertising")

          advertisingParameters
          .setLegacyMode(false)
          .setScannable(false)
          .setSecondaryPhy(BluetoothDevice.PHY_LE_2M);

          if(bluetoothAdapter?.isLeCodedPhySupported() as Boolean) {
            Log.i(TAG,"Coded PHY supported, using it")
            advertisingParameters
            .setPrimaryPhy(BluetoothDevice.PHY_LE_CODED)
          }
          else {
            Log.i(TAG,"Coded PHY not supported, using 1M PHY")
            advertisingParameters
            .setPrimaryPhy(BluetoothDevice.PHY_LE_1M)
          }

          advertisingData
          .setIncludeDeviceName(true);
        }

        bleAdvertiser?.startAdvertisingSet(
          advertisingParameters.build(),
          advertisingData?.build(),
          null,null,null,
          advertisingCallback
        )
      }
    }

    private val bluetoothGattClientCallback : BluetoothGattCallback = object : BluetoothGattCallback() {
      override fun onConnectionStateChange(gatt: BluetoothGatt, status: Int, newState: Int) {
        Log.i(TAG,"Bluetooth GATT Client Callback onConnectionStateChange. Status : " + status + ", STATE : " + when(newState) {
            BluetoothProfile.STATE_DISCONNECTED -> "STATE_DISCONNECTED"
            BluetoothProfile.STATE_DISCONNECTING -> "STATE_DISCONNECTING"
            BluetoothProfile.STATE_CONNECTED -> "STATE_CONNECTED"
            BluetoothProfile.STATE_CONNECTING -> "STATE_CONNECTING"
            else -> "UNKNOWN STATE"
        });

        if(newState == BluetoothProfile.STATE_CONNECTED) {
          gatt.discoverServices();
          reactContext.getJSModule(RCTDeviceEventEmitter::class.java)
          .emit(emitterStrings.CONNECTION_STATE_CHANGE,bluetoothStates.STATE_CONNECTED)
        }
        else if (newState == BluetoothProfile.STATE_DISCONNECTED) {
          reactContext.getJSModule(RCTDeviceEventEmitter::class.java)
          .emit(emitterStrings.CONNECTION_STATE_CHANGE,bluetoothStates.STATE_DISCONNECTED)
        }
      }

      override fun onServicesDiscovered(gatt : BluetoothGatt, status : Int) {
        Log.i(TAG, "onServicesDiscovered fires, status : $status");
        if(status == BluetoothGatt.GATT_SUCCESS) {
          val services = gatt.getServices();

          val userDataService : BluetoothGattService? = services.find {
            service -> service.uuid.equals(userDataServiceUUID)
          };

          val publicKeyCharacteristic : BluetoothGattCharacteristic? =
          userDataService?.characteristics?.find { characteristic ->
            characteristic.uuid.equals(publicKeyCharacteristicUUID)
          };

          if(publicKeyCharacteristic != null) {
            Log.i(TAG,"Characteristic with matching UUID found, reading descriptor.")
            gatt.readCharacteristic(publicKeyCharacteristic)
          }
          else {
            Log.i(TAG,"No Matching service/characteristic found, disconnecting");
            gatt.disconnect();
          }
        }
      }

      override fun onCharacteristicRead(gatt: BluetoothGatt, characteristic : BluetoothGattCharacteristic, status: Int) {
       Log.i(TAG,"Bluetooth GATT Client Callback onCharacteristicRead, status : $status");
       Log.i(TAG,"UUID : ${characteristic.uuid.toString()}")

       if(characteristic.uuid.equals(publicKeyCharacteristicUUID)) {
         val publicKeyBytes : ByteArray = characteristic.getValue();
         val publicKeyString = Base64.encodeToString(publicKeyBytes,Base64.DEFAULT);
         val publicKeyObject : WritableMap = Arguments.createMap();
         publicKeyObject.putString("key",publicKeyString);

         reactContext.getJSModule(RCTDeviceEventEmitter::class.java)
         .emit(emitterStrings.NEW_DATA_FROM_CONNECTION,publicKeyObject)
       }
      }
    }

    fun connectToBLEPeripheral(peripheral : BluetoothDevice) {
      if(bleScanning) {
        bleScanner?.stopScan(leScanCallback);
        bleScanning = false;
      }
      peripheral.connectGatt(
        context,
        false,
        bluetoothGattClientCallback,
        BluetoothDevice.TRANSPORT_LE
      )
    }

    private fun startGATTService(publicKey : String) {
      try {

        val service : BluetoothGattService = BluetoothGattService(
          peripheralScanServiceUUID,
          BluetoothGattService.SERVICE_TYPE_PRIMARY
        );
        
        //characteristic through which the message queue will be read
        val publicKeyCharacteristic = BluetoothGattCharacteristic(
          publicKeyCharacteristicUUID,
          BluetoothGattCharacteristic.PROPERTY_READ,
          BluetoothGattCharacteristic.PERMISSION_READ
        );

        publicKeyCharacteristic.setValue(publicKey)

        service.addCharacteristic(publicKeyCharacteristic);

        val gattServer = bluetoothManager?.openGattServer(context, bluetoothGattServerCallback);
        gattServer?.addService(service);
        Log.i(TAG,"BLE Gatt Server Started");
      }
      catch(e : Exception) {
        Log.d(TAG,"Error creating bluetooth GATT Server : " + e);
      }
    }

    private val bluetoothGattServerCallback : BluetoothGattServerCallback = object : BluetoothGattServerCallback() {
      override fun onConnectionStateChange(device : BluetoothDevice, status : Int, newState : Int) {
        Log.i(TAG,"Bluetooth GATT Server Callback onConnectionStateChange. Status : " + status + ", STATE : " + when(newState) {
            BluetoothProfile.STATE_DISCONNECTED -> "STATE_DISCONNECTED"
            BluetoothProfile.STATE_DISCONNECTING -> "STATE_DISCONNECTING"
            BluetoothProfile.STATE_CONNECTED -> "STATE_CONNECTED"
            BluetoothProfile.STATE_CONNECTING -> "STATE_CONNECTING"
            else -> "UNKNOWN STATE"
        } + ", Thread : ${Thread.currentThread()}");

        if(newState == BluetoothProfile.STATE_CONNECTED) {
          reactContext.getJSModule(RCTDeviceEventEmitter::class.java)
          .emit(emitterStrings.CONNECTION_STATE_CHANGE,bluetoothStates.STATE_CONNECTED)
        }
        else if (newState == BluetoothProfile.STATE_DISCONNECTED) {
          reactContext.getJSModule(RCTDeviceEventEmitter::class.java)
          .emit(emitterStrings.CONNECTION_STATE_CHANGE,bluetoothStates.STATE_DISCONNECTED)
        }
      }

      override fun onCharacteristicReadRequest(device : BluetoothDevice, requestId : Int,
      offset : Int, characteristic : BluetoothGattCharacteristic) {
          Log.i(TAG,"Bluetooth GATT Server Callback onCharacteristicReadRequest, id : $requestId, offset : $offset");
      }

      override fun onCharacteristicWriteRequest(device : BluetoothDevice, requestId : Int,
         characteristic : BluetoothGattCharacteristic, preparedWrite : Boolean,
         responseNeeded : Boolean, offset : Int, value : ByteArray) {
           Log.i(TAG,"Bluetooth GATT Server Callback onCharacteristicWriteRequest");
           Log.i(TAG,"characteristic value size : ${value.size}");
      }

      override fun onServiceAdded(status : Int, service : BluetoothGattService) {
        Log.i(TAG,"GATT Server onServiceAdded, status : $status");
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
                shouldRun = false;
                this.cancel();
              }
              else {
                context.getJSModule(RCTDeviceEventEmitter::class.java)
                .emit(emitterStrings.CONNECTION_STATE_CHANGE,bluetoothStates.STATE_CONNECTED)
                // Read from the InputStream.
                numBytes = try {
                    inputStream.read(buffer);
                } catch (e: Exception) {
                    Log.d(TAG, "Input stream was disconnected", e);

                    context.getJSModule(RCTDeviceEventEmitter::class.java)
                    .emit(emitterStrings.CONNECTION_STATE_CHANGE,bluetoothStates.STATE_DISCONNECTED);

                    break;
                }

                //get string from byte array
                val receivedString : String = String(buffer.copyOfRange(0,numBytes));
                Log.d(TAG, "Received message over BT Connection : " + receivedString);

                //emit string upwards to javscript event listener
                context.getJSModule(RCTDeviceEventEmitter::class.java)
                .emit(emitterStrings.NEW_DATA_FROM_CONNECTION,receivedString);
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
          .emit(emitterStrings.CONNECTION_STATE_CHANGE,bluetoothStates.STATE_DISCONNECTED)
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
