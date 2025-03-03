package com.herd

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.BaseActivityEventListener

import com.facebook.react.modules.core.PermissionListener
import com.facebook.react.modules.core.PermissionAwareActivity

import android.Manifest.permission
import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.content.Context

import android.util.Log
import android.content.pm.PackageManager

import androidx.core.content.ContextCompat

import android.os.Build

import android.provider.Settings

class PermissionManagerModule(reactContext : ReactApplicationContext) : ReactContextBaseJavaModule(reactContext),PermissionListener {
  private final val TAG : String = "HerdPermissionManagerModule";
  private final val context = reactContext;

  private val BLUETOOTH_BACKGROUND_LOCATION_REQUEST_CODE : Int = 1;
  private val BLUETOOTH_SCAN_PERMISSION_REQUEST_CODE : Int = 2;
  private val LOCATION_PERMISSION_REQUEST_CODE : Int = 3;
  private val POST_NOTIFICATIONS_REQUEST_CODE : Int = 4;
  private val NAVIGATE_TO_NOTIFICATION_SETTINGS_REQUEST_CODE : Int = 5;

  var locationPermissionPromise : Promise? = null;
  var bluetoothScanPermissionPromise : Promise? = null;
  var postNotificationsPromise: Promise? = null;

  override fun getName() : String {
    return "PermissionManagerModule"
  }

  override fun getConstants() : Map<String,Any> {
    val constants : Map<String, Any> = mapOf(
      "navigationTargets" to mapOf (
        "settings" to Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
        "notificationSettings" to Settings.ACTION_APP_NOTIFICATION_SETTINGS,
        "locationSettings" to Settings.ACTION_LOCATION_SOURCE_SETTINGS
      )
    )

    return constants
  }
  
  companion object {
    fun checkPermissionsGranted(permissions : List<String>, context : Context) : Boolean {
      for(permission in permissions) {
        val granted = ContextCompat.checkSelfPermission(
          context,
          permission
        ) == PackageManager.PERMISSION_GRANTED;
        if (!granted) return false;
      }
      return true;
    }

    fun checkPermissionsGrantedForService(context : Context) : Boolean {
      var permissions = mutableListOf(
        permission.ACCESS_COARSE_LOCATION,
        permission.ACCESS_FINE_LOCATION,
        permission.ACCESS_BACKGROUND_LOCATION, 
      )
      if(Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        permissions.addAll(listOf(
          permission.BLUETOOTH_SCAN,
          permission.BLUETOOTH_CONNECT,
          permission.BLUETOOTH_ADVERTISE
        ))
      }
      return checkPermissionsGranted(
        permissions,
        context
      )
    }

  }

  override fun onRequestPermissionsResult(requestCode: Int,permissions: Array<String>,grantResults: IntArray) : Boolean {
    if(grantResults.isNotEmpty()) {
      for(i in 0..(permissions.size -1)) {
        Log.i(TAG,"Permission : ${permissions.get(i)}, result : ${grantResults.get(i)}")
      }
    }
    val allPermissionsGranted = grantResults.all{it == PackageManager.PERMISSION_GRANTED}
    if(requestCode == BLUETOOTH_BACKGROUND_LOCATION_REQUEST_CODE) {
      Log.i(TAG,"access background location request")
      if(allPermissionsGranted) {
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
      Log.i(TAG,"All Location Permissions granted : $allPermissionsGranted")
      locationPermissionPromise?.resolve(allPermissionsGranted);
      locationPermissionPromise = null;
    }
    else if(requestCode == BLUETOOTH_SCAN_PERMISSION_REQUEST_CODE) {
      Log.i(TAG,"onRequestPermissionsResult bluetooth scan permission request code");
      Log.i(TAG,"All Bluetooth Scan Permissions granted : $allPermissionsGranted")
      bluetoothScanPermissionPromise?.resolve(allPermissionsGranted);
      bluetoothScanPermissionPromise = null;
    }

    if(requestCode == POST_NOTIFICATIONS_REQUEST_CODE) {
      postNotificationsPromise?.resolve(grantResults.isNotEmpty() && allPermissionsGranted)
      postNotificationsPromise = null;
    }
    
    return true;
  }

  @ReactMethod
  fun requestBTPermissions(promise : Promise) {
    if(Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      val activity : PermissionAwareActivity = getReactApplicationContext().getCurrentActivity() as PermissionAwareActivity
      bluetoothScanPermissionPromise = promise;
      activity.requestPermissions(
        arrayOf(permission.BLUETOOTH_SCAN,permission.BLUETOOTH_CONNECT,permission.BLUETOOTH_ADVERTISE),
        BLUETOOTH_SCAN_PERMISSION_REQUEST_CODE,
        this
      )
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
      promise.resolve(checkPermissionsGranted(permissions, context as Context));
    }
    else {
      promise.resolve(true)
    }
  }

  @ReactMethod
  fun checkLocationPermission(promise : Promise) {
    val permissions = listOf(
      permission.ACCESS_BACKGROUND_LOCATION,
      permission.ACCESS_FINE_LOCATION
    )
    promise.resolve(checkPermissionsGranted(permissions, context as Context));
  }

  @ReactMethod
  fun requestLocationPermissions(promise : Promise) {
    val activity : PermissionAwareActivity = getReactApplicationContext().getCurrentActivity() as PermissionAwareActivity
    locationPermissionPromise = promise;
    activity.requestPermissions(
      arrayOf(permission.ACCESS_BACKGROUND_LOCATION),
      BLUETOOTH_BACKGROUND_LOCATION_REQUEST_CODE,
      this
    )
  }

  @ReactMethod
  fun requestNotificationPermissions(promise : Promise) {
    val activity : PermissionAwareActivity = getReactApplicationContext().getCurrentActivity() as PermissionAwareActivity
    postNotificationsPromise = promise;
    activity.requestPermissions(
      arrayOf(permission.POST_NOTIFICATIONS),
      POST_NOTIFICATIONS_REQUEST_CODE,
      this
    )
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  fun navigateToSettings(navigationTarget : String) {
    val activity : Activity? = getReactApplicationContext().getCurrentActivity();
    if(activity !== null) {
      val intent = Intent(navigationTarget);
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
      if(navigationTarget == Settings.ACTION_APPLICATION_DETAILS_SETTINGS) {
        val uri = Uri.fromParts("package", activity.getPackageName(), null);
        intent.setData(uri);
      }
      else {
        intent.putExtra("android.provider.extra.APP_PACKAGE", activity.getPackageName());
      }
      context.startActivity(intent);
    }
  }
}
