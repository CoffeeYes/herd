package com.herd

import android.app.Service
import android.content.Intent
import android.os.IBinder
import android.util.Log

class HerdBackgroundService : Service() {
  private val TAG = "HerdBackgroundService"

  override fun onCreate() {
      Log.i(TAG, "Service onCreate")
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
