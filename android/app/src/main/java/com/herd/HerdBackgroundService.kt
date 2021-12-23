package com.herd

import android.app.Service
import android.content.Intent
import android.content.Context
import android.os.IBinder
import android.util.Log

import android.bluetooth.BluetoothAdapter
import android.bluetooth.le.BluetoothLeScanner
import android.bluetooth.le.BluetoothLeAdvertiser
import android.bluetooth.le.AdvertiseData
import android.bluetooth.le.AdvertisingSetParameters
import android.bluetooth.le.AdvertisingSetCallback
import android.bluetooth.le.AdvertisingSet
import android.bluetooth.le.ScanCallback
import android.bluetooth.le.ScanResult
import android.bluetooth.le.ScanFilter
import android.bluetooth.le.ScanSettings

import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothManager
import android.bluetooth.BluetoothGattService
import android.bluetooth.BluetoothGattServer
import android.bluetooth.BluetoothGattServerCallback
import android.bluetooth.BluetoothGattCharacteristic
import android.bluetooth.BluetoothGattDescriptor

import android.os.Handler
import android.os.ParcelUuid
import java.util.UUID

import android.app.Notification
import android.app.NotificationManager
import android.app.NotificationChannel
import android.app.PendingIntent
import android.R.drawable

class HerdBackgroundService : Service() {
  private val TAG = "HerdBackgroundService";
  private var bluetoothAdapter : BluetoothAdapter? = null;
  private var BLEScanner : BluetoothLeScanner? = null;
  private var BLEAdvertiser : BluetoothLeAdvertiser? = null;
  private val serviceUUID = UUID.fromString("30895318-6f7e-4f68-b21a-01a4e2f946fa");
  private final val parcelServiceUUID = ParcelUuid(serviceUUID);
  private val bluetoothManager : BluetoothManager = this.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager

  companion object {
    var running : Boolean = false;
  }

  override fun onCreate() {
      Log.i(TAG, "Service onCreate")
      try {
        bluetoothAdapter = BluetoothAdapter.getDefaultAdapter();
        if(bluetoothAdapter === null) {
          throw Exception("No Bluetooth Adapter Found");
        }

        BLEScanner = bluetoothAdapter?.bluetoothLeScanner;
        if(BLEScanner === null) {
          throw Exception("No BLE Scanner Found");
        }

        val pendingIntent: PendingIntent = Intent(this, MainActivity::class.java).let { notificationIntent ->
            PendingIntent.getActivity(this, 0, notificationIntent, 0)
        }

        //create notification channel
        val CHANNEL_ID = "HerdServiceChannel"
        val name = "Herd Service Channel"
        val descriptionText = "Herd Background Service"
        val importance = NotificationManager.IMPORTANCE_DEFAULT
        val mChannel = NotificationChannel(CHANNEL_ID, name, importance)
        mChannel.description = descriptionText
        // Register the channel with the system; you can't change the importance
        // or other notification behaviors after this
        val notificationManager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.createNotificationChannel(mChannel)

        //create notification
        val notification : Notification = Notification.Builder(this,CHANNEL_ID)
        .setOngoing(true)
        .setContentTitle("Herd Background Service")
        .setContentText("Herd is Running in the background in order to transfer messages")
        .setContentIntent(pendingIntent)
        .setSmallIcon(R.mipmap.ic_launcher)
        .setCategory(Notification.CATEGORY_SERVICE)
        .build()

        try {
          startForeground(5,notification)
        }
        catch(e : Exception) {
          Log.e(TAG, "Error starting service in foreground")
        }
      }
      catch(e : Exception) {
        Log.e(TAG, "Error creating background service",e)
      }
  }

  val leScanCallback: ScanCallback = object : ScanCallback() {
      override fun onScanResult(callbackType: Int, result: ScanResult) {
          super.onScanResult(callbackType, result);
          Log.i(TAG, "BLE Scan Result Callback Invoked")
          //perform actions related to finding a device
          val device : BluetoothDevice = result.getDevice();
          val name = device.getName();
          val address = device.getAddress();
          Log.i(TAG, "device name : " + name);
          Log.i(TAG, "device Address : " + address);
      }
  }

  fun scanLeDevice() {
      /* var scanning = false;
      val handler = Handler();

      val SCAN_PERIOD : Long = 10000; */

      /* BLEScanner?.let { scanner ->
          if (!scanning) { // Stops scanning after a pre-defined scan period.
              handler.postDelayed({
                  scanning = false
                  scanner.stopScan(leScanCallback)
              }, SCAN_PERIOD)
              scanning = true
              scanner.startScan(leScanCallback)
          } else {
              scanning = false
              scanner.stopScan(leScanCallback)
          }
      } */
      val filter = ScanFilter.Builder()
      .setServiceUuid(parcelServiceUUID)
      .build()

      val settings = ScanSettings.Builder()
      .setScanMode(ScanSettings.SCAN_MODE_LOW_POWER)
      .build()

      BLEScanner?.startScan(listOf(filter),settings,leScanCallback);
  }

  private val advertisingCallback : AdvertisingSetCallback = object : AdvertisingSetCallback() {
    override fun onAdvertisingSetStarted(advertisingSet : AdvertisingSet?, txPower : Int, status : Int) {
      Log.i(TAG, "onAdvertisingSetStarted(): txPower:" + txPower + " , status: "
      + status);
      /* currentAdvertisingSet = advertisingSet; */
    }

    override fun onAdvertisingDataSet(advertisingSet : AdvertisingSet?, status : Int) {
      Log.i(TAG, "onAdvertisingDataSet() :status:" + status);
    }

    override fun onScanResponseDataSet(advertisingSet : AdvertisingSet?,status : Int) {
      Log.i(TAG, "onScanResponseDataSet(): status:" + status);
    }

    override fun onAdvertisingSetStopped(advertisingSet : AdvertisingSet?) {
      Log.i(TAG, "onAdvertisingSetStopped():");
    }
  };

  fun advertiseLE() {
    //https://source.android.com/devices/bluetooth/ble_advertising
    BLEAdvertiser = BluetoothAdapter.getDefaultAdapter().getBluetoothLeAdvertiser();
    if(BLEAdvertiser != null) {
      Log.i(TAG,"Bluetooth LE Advertiser Found");
      // Check if all features are supported
      if (!(bluetoothAdapter?.isLe2MPhySupported() as Boolean)) {
          Log.e(TAG, "2M PHY not supported!");
          /* return; */
      }
      if (!(bluetoothAdapter?.isLeExtendedAdvertisingSupported() as Boolean)) {
          Log.e(TAG, "LE Extended Advertising not supported!");
          /* return; */
      }

      var advertisingParameters : AdvertisingSetParameters.Builder? = null;

      var advertisingData = AdvertiseData.Builder()
      .addServiceUuid(parcelServiceUUID)

      if((bluetoothAdapter?.isLe2MPhySupported() as Boolean)) {
        val maxDataLength : Int? = bluetoothAdapter?.getLeMaximumAdvertisingDataLength();

        advertisingParameters = AdvertisingSetParameters.Builder()
        .setLegacyMode(false)
        .setInterval(AdvertisingSetParameters.INTERVAL_LOW)
        .setTxPowerLevel(AdvertisingSetParameters.TX_POWER_MEDIUM)
        .setPrimaryPhy(BluetoothDevice.PHY_LE_1M)
        .setSecondaryPhy(BluetoothDevice.PHY_LE_2M);

        //include device name when extended advertising is supported
        if((bluetoothAdapter?.isLeExtendedAdvertisingSupported() as Boolean)) {
          advertisingData.setIncludeDeviceName(true);
        }
        else {
          advertisingData.setIncludeDeviceName(false);
        }

      }
      else {
        Log.i(TAG,"Using Legacy BLE advertising")
        advertisingParameters = AdvertisingSetParameters.Builder()
        .setLegacyMode(true) // True by default, but set here as a reminder.
        /* .setConnectable(true) */ // cant be both connectable and scannable
        .setScannable(true)
        .setInterval(AdvertisingSetParameters.INTERVAL_MEDIUM)
        .setTxPowerLevel(AdvertisingSetParameters.TX_POWER_LOW);

        //dont include device name in legacy mode as advertisingData size is limited
        advertisingData.setIncludeDeviceName(false);
      }
      BLEAdvertiser?.startAdvertisingSet(
        advertisingParameters?.build(),
        advertisingData?.build(),
        null,null,null,
        advertisingCallback
      )
    }
  }

  private val bluetoothGattServerCallback : BluetoothGattServerCallback = object : BluetoothGattServerCallback() {
    override fun onConnectionStateChange(device : BluetoothDevice, stats : Int, newState : Int) {

    }

    override fun onCharacteristicReadRequest(device : BluetoothDevice, requestId : Int,
       offset : Int, characteristic : BluetoothGattCharacteristic) {

    }

    override fun onCharacteristicWriteRequest(device : BluetoothDevice, requestId : Int,
       characteristic : BluetoothGattCharacteristic, preparedWrite : Boolean,
       responseNeeded : Boolean, offset : Int, value : ByteArray) {

    }

    override fun onDescriptorReadRequest(device : BluetoothDevice, requestId : Int,
      offset : Int, descriptor : BluetoothGattDescriptor) {

    }

    override fun onDescriptorWriteRequest(device : BluetoothDevice, requestId : Int,
      descriptor : BluetoothGattDescriptor, preparedWrite : Boolean,
      responseNeeded : Boolean, offset : Int, value : ByteArray) {

    }
  }

  fun startGATTService() {
    val server : BluetoothGattServer = bluetoothManager.openGattServer(this, bluetoothGattServerCallback);
    val service : BluetoothGattService = BluetoothGattService(serviceUUID,BluetoothGattService.SERVICE_TYPE_PRIMARY);
    val characteristic : BluetoothGattCharacteristic = BluetoothGattCharacteristic(UUID.fromString("11112902-1111-1111-8111-00805f9b34fb"),
                    BluetoothGattCharacteristic.PROPERTY_READ or BluetoothGattCharacteristic.PROPERTY_WRITE or
                    BluetoothGattCharacteristic.PROPERTY_NOTIFY,
                    BluetoothGattCharacteristic.PERMISSION_READ or BluetoothGattCharacteristic.PERMISSION_WRITE);
    characteristic.addDescriptor(BluetoothGattDescriptor(UUID.fromString("00002902-0000-1000-8000-00805f9b34fb"), BluetoothGattCharacteristic.PERMISSION_WRITE));
    service.addCharacteristic(characteristic);

    server.addService(service);
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.i(TAG, "Service onStartCommand " + startId)
        scanLeDevice();
        advertiseLE();
        running = true;
        return Service.START_STICKY
    }

  override fun onBind(intent : Intent) : IBinder? {
    Log.i(TAG, "Service onBind")
    return null;
  }

  override fun onDestroy() {
      Log.i(TAG, "Service onDestroy")
      BLEScanner?.stopScan(leScanCallback)
      BLEAdvertiser?.stopAdvertisingSet(advertisingCallback);
      running = false;
  }
}
