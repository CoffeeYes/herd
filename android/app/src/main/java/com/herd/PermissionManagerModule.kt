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

  val permissionRequestCodeStrings : Map<Int,String> = mapOf(
    BLUETOOTH_BACKGROUND_LOCATION_REQUEST_CODE to "BLUETOOTH_BACKGROUND_LOCATION_REQUEST_CODE ",
    LOCATION_PERMISSION_REQUEST_CODE to "LOCATION_PERMISSION_REQUEST_CODE ",
    BLUETOOTH_SCAN_PERMISSION_REQUEST_CODE to "BLUETOOTH_SCAN_PERMISSION_REQUEST_CODE ",
    POST_NOTIFICATIONS_REQUEST_CODE to "POST_NOTIFICATIONS_REQUEST_CODE "
  )

  override fun onRequestPermissionsResult(requestCode: Int,permissions: Array<String>,grantResults: IntArray) : Boolean {
    val allPermissionsGranted = grantResults.all{it == PackageManager.PERMISSION_GRANTED}
    val requestCodeString = permissionRequestCodeStrings.get(requestCode) 
    if(requestCodeString != null) {
      Log.i(TAG,"onRequestPermissionsResult requestCode : $requestCodeString, allPermissionsGranted : $allPermissionsGranted")
    }
    else {
      Log.d(TAG,"onRequestPermissionsResult unknown requestCode : $requestCode");
    }
    when(requestCode) {
      BLUETOOTH_BACKGROUND_LOCATION_REQUEST_CODE -> {
        if(allPermissionsGranted) {
          val activity : PermissionAwareActivity = getReactApplicationContext().getCurrentActivity() as PermissionAwareActivity
          activity.requestPermissions(
            arrayOf(permission.ACCESS_COARSE_LOCATION,permission.ACCESS_FINE_LOCATION),
            LOCATION_PERMISSION_REQUEST_CODE,
            this
          )
        }
        else {
          locationPermissionPromise?.resolve(false);
          locationPermissionPromise = null;
        }
      }
      LOCATION_PERMISSION_REQUEST_CODE -> {
        locationPermissionPromise?.resolve(allPermissionsGranted);
        locationPermissionPromise = null;
      }
      BLUETOOTH_SCAN_PERMISSION_REQUEST_CODE -> {
        bluetoothScanPermissionPromise?.resolve(allPermissionsGranted);
        bluetoothScanPermissionPromise = null;
      }
      POST_NOTIFICATIONS_REQUEST_CODE -> {
        postNotificationsPromise?.resolve(grantResults.isNotEmpty() && allPermissionsGranted)
        postNotificationsPromise = null;
      }
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
