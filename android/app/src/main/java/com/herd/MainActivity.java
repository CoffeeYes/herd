package com.herd;

import com.facebook.react.ReactActivity;

import android.view.WindowManager;
import android.os.Bundle;
import android.Manifest;
import android.content.pm.PackageManager;
import androidx.core.app.ActivityCompat;
import android.util.Log;

public class MainActivity extends ReactActivity {

  private static final String TAG = "HerdMainActivity";
  private static final int BLUETOOTH_CONNECT_PERMISSION_REQUEST_CODE = 1;

  private Bundle instanceBundle;

  @Override
  public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] granted) {
    Log.d(TAG,"onRequestPermissionsResult");
    for(int i = 0; i < permissions.length; i++) {
      Log.i(TAG,"permission : " + permissions[i] + ", granted : " + granted[i]);
      if(permissions[i] == Manifest.permission.BLUETOOTH_CONNECT) {
        if(granted[i] == PackageManager.PERMISSION_GRANTED) {
          startApp(instanceBundle);
        }
        else {
          ActivityCompat.requestPermissions(
            this,
            new String[] { Manifest.permission.BLUETOOTH_CONNECT },
            BLUETOOTH_CONNECT_PERMISSION_REQUEST_CODE
          );
        }
      }
    }
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  @Override
  protected String getMainComponentName() {
    return "herd";
  }

  private void startApp(Bundle savedInstanceBundle) {
    super.onCreate(savedInstanceBundle);
    getWindow().setFlags(WindowManager.LayoutParams.FLAG_SECURE,
    WindowManager.LayoutParams.FLAG_SECURE);
  }

  @Override
  protected void onCreate(Bundle savedInstanceBundle) {
    int bluetoothConnectPermission = ActivityCompat.checkSelfPermission(
      getApplicationContext(),
      Manifest.permission.BLUETOOTH_CONNECT
    );
    if (bluetoothConnectPermission != PackageManager.PERMISSION_GRANTED) {
      instanceBundle = savedInstanceBundle;
      ActivityCompat.requestPermissions(
        this,
        new String[] { Manifest.permission.BLUETOOTH_CONNECT },
        BLUETOOTH_CONNECT_PERMISSION_REQUEST_CODE
      );
    }
    else {
      startApp(savedInstanceBundle);
    }
  }
}
