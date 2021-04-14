package com.herd

import android.app.Service
import android.content.Intent
import android.os.IBinder
import android.util.Log

import android.bluetooth.BluetoothAdapter
import android.bluetooth.le.BluetoothLeScanner
import android.bluetooth.le.ScanCallback
import android.bluetooth.le.ScanResult
import android.os.Handler

import android.app.Notification
import android.app.PendingIntent
import android.R.drawable

class HerdBackgroundService : Service() {
  private val TAG = "HerdBackgroundService";
  var bluetoothAdapter : BluetoothAdapter? = null;

  override fun onCreate() {
      Log.i(TAG, "Service onCreate")
      try {
        bluetoothAdapter = BluetoothAdapter.getDefaultAdapter();
        if(bluetoothAdapter === null) {
          throw("No Bluetooth Adapter Found" as Exception);
        }

        val pendingIntent: PendingIntent = Intent(this, MainActivity::class.java).let { notificationIntent ->
            PendingIntent.getActivity(this, 0, notificationIntent, 0)
        }

        val notification : Notification = Notification.Builder(this,"Herd")
        .setContentTitle("Herd Background Service")
        .setContentText("Herd is Running in the background in order to transfer messages")
        .setContentIntent(pendingIntent)
        .setSmallIcon(R.mipmap.ic_launcher)
        .build()

        startForeground(5,notification)
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
      }
  }

  fun scanLeDevice() {
      val BLEScanner : BluetoothLeScanner? = bluetoothAdapter?.bluetoothLeScanner;
      var scanning = false;
      val handler = Handler();

      val SCAN_PERIOD : Long = 10000;

      BLEScanner?.let { scanner ->
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
      }
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.i(TAG, "Service onStartCommand " + startId)
        scanLeDevice();
        return Service.START_STICKY
    }

  override fun onBind(intent : Intent) : IBinder? {
    Log.i(TAG, "Service onBind")
    return null;
  }

  override fun onDestroy() {
      Log.i(TAG, "Service onDestroy")
  }
}
