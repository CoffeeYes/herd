package com.herd;

import com.facebook.react.ReactActivity;

import android.view.WindowManager;
import android.os.Bundle;

public class MainActivity extends ReactActivity {

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
