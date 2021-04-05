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

class HerdBackgroundService : Service() {
  private val TAG = "HerdBackgroundService"

  override fun onCreate() {
      Log.i(TAG, "Service onCreate")
      try {
        val bluetoothAdapter : BluetoothAdapter? = BluetoothAdapter.getDefaultAdapter();
        if(bluetoothAdapter === null) {
          throw("No Bluetooth Adapter Found" as Exception);
        }
        else {
          val BLEScanner : BluetoothLeScanner? = bluetoothAdapter?.bluetoothLeScanner;
          var scanning = false;
          val handler = Handler();

          val SCAN_PERIOD : Long = 10000;

          val leScanCallback: ScanCallback = object : ScanCallback() {
              override fun onScanResult(callbackType: Int, result: ScanResult) {
                  super.onScanResult(callbackType, result);

                  //perform actions related to finding a device
              }
          }

          fun scanLeDevice() {
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

          scanLeDevice();
        }
      }
      catch(e : Exception) {
        Log.e(TAG, "Error creating background service",e)
      }
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.i(TAG, "Service onStartCommand " + startId)
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