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

    if(requestCode == POST_NOTIFICATIONS_REQUEST_CODE) {
      if(grantResults.isNotEmpty()) {
        val granted = grantResults.get(0) === PackageManager.PERMISSION_GRANTED;
        postNotificationsPromise?.resolve(granted);
      }
      else {
        postNotificationsPromise?.resolve(false);
      }
      postNotificationsPromise = null;
    }
    
    bluetoothScanPermissionPromise = null;
    return true;
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
  fun requestNotificationPermissions(promise : Promise) {
    val activity : PermissionAwareActivity = getReactApplicationContext().getCurrentActivity() as PermissionAwareActivity
    if(activity !== null) {
      postNotificationsPromise = promise;
      activity.requestPermissions(
        arrayOf(permission.POST_NOTIFICATIONS),
        POST_NOTIFICATIONS_REQUEST_CODE,
        this
      )
    }
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  fun navigateToSettings(navigationTarget : String) {
    val activity : Activity? = getReactApplicationContext().getCurrentActivity();
    val intent = Intent(navigationTarget);
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    if(navigationTarget == Settings.ACTION_APPLICATION_DETAILS_SETTINGS) {
      val uri = Uri.fromParts("package", activity?.getPackageName(), null);
      intent.setData(uri);
    }
    else {
      intent.putExtra("android.provider.extra.APP_PACKAGE", activity?.getPackageName());
    }
    context.startActivity(intent);
  }
}
