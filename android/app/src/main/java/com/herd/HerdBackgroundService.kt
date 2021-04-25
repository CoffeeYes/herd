package com.herd

import android.app.Service
import android.content.Intent
import android.os.IBinder
import android.util.Log

import android.bluetooth.BluetoothAdapter
import android.bluetooth.le.BluetoothLeScanner
import android.bluetooth.le.ScanCallback
import android.bluetooth.le.ScanResult
import android.bluetooth.le.ScanFilter
import android.bluetooth.le.ScanSettings
import android.bluetooth.BluetoothDevice
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
  private final val serviceUUID = ParcelUuid(UUID.fromString("30895318-6f7e-4f68-b21a-01a4e2f946fa"));

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
      .setServiceUuid(serviceUUID)
      .build()

      val settings = ScanSettings.Builder()
      .setScanMode(ScanSettings.SCAN_MODE_LOW_POWER)
      .build()

      BLEScanner?.startScan(listOf(filter),settings,leScanCallback);
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.i(TAG, "Service onStartCommand " + startId)
        scanLeDevice();
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
      running = false;
  }
}
