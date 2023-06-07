package com.herd;

import com.facebook.react.ReactActivity;

import android.view.WindowManager;
import android.os.Bundle;
import android.os.Build;
import android.Manifest;
import android.content.pm.PackageManager;
import androidx.core.app.ActivityCompat;
import android.util.Log;

public class MainActivity extends ReactActivity {

  private static final String TAG = "HerdMainActivity";

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  @Override
  protected String getMainComponentName() {
    return "herd";
  }

  @Override
  protected void onCreate(Bundle savedInstanceBundle) {
    super.onCreate(savedInstanceBundle);
    getWindow().setFlags(WindowManager.LayoutParams.FLAG_SECURE,
    WindowManager.LayoutParams.FLAG_SECURE);
  }
}
