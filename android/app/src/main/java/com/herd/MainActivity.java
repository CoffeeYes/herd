package com.herd;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.ReactRootView;

import android.view.WindowManager;
import android.os.Bundle;
import android.os.Build;
import android.Manifest;
import android.content.pm.PackageManager;
import androidx.core.app.ActivityCompat;
import android.util.Log;
import com.facebook.react.modules.core.PermissionListener;
import com.facebook.react.modules.core.PermissionAwareActivity;

import android.app.NotificationChannel;
import android.app.NotificationManager;

import java.util.List;

public class MainActivity extends ReactActivity implements PermissionAwareActivity {

  private static final String TAG = "HerdMainActivity";
  private PermissionListener permissionListener;

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  @Override
  protected String getMainComponentName() {
    return "herd";
  }

  /**
   * Returns the instance of the {@link ReactActivityDelegate}. There the RootView is created and
   * you can specify the renderer you wish to use - the new renderer (Fabric) or the old renderer
   * (Paper).
   */
  @Override
  protected ReactActivityDelegate createReactActivityDelegate() {
    return new MainActivityDelegate(this, getMainComponentName());
  }

  public static class MainActivityDelegate extends ReactActivityDelegate {
    public MainActivityDelegate(ReactActivity activity, String mainComponentName) {
      super(activity, mainComponentName);
    }

    @Override
    protected ReactRootView createRootView() {
      ReactRootView reactRootView = new ReactRootView(getContext());
      // If you opted-in for the New Architecture, we enable the Fabric Renderer.
      reactRootView.setIsFabric(false);
      return reactRootView;
    }

    @Override
    protected boolean isConcurrentRootEnabled() {
      // If you opted-in for the New Architecture, we enable Concurrent Root (i.e. React 18).
      // More on this on https://reactjs.org/blog/2022/03/29/react-v18.html
      return false;
    }
  }

  @Override
  protected void onCreate(Bundle savedInstanceBundle) {
    super.onCreate(savedInstanceBundle);
    getWindow().setFlags(WindowManager.LayoutParams.FLAG_SECURE,
    WindowManager.LayoutParams.FLAG_SECURE);

    NotificationChannel serviceChannel = new NotificationChannel(
      getString(R.string.serviceChannelID),
      "Background Service Notification",
      NotificationManager.IMPORTANCE_DEFAULT
    );
    serviceChannel.setDescription("Herd Background Service");

    NotificationChannel messageChannel = new NotificationChannel(
      getString(R.string.messageChannelID),
      "New Message Notifications",
      NotificationManager.IMPORTANCE_DEFAULT
    );
    serviceChannel.setDescription("Herd Messages");

    NotificationManager notificationManager = getSystemService(NotificationManager.class);
    notificationManager.createNotificationChannels(List.of(serviceChannel,messageChannel));
  }

  @Override
  public void requestPermissions(String[] permissions, int requestCode, PermissionListener listener) {
    permissionListener = listener;
    requestPermissions(permissions,requestCode);
  }

  @Override
  public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
    if(permissionListener != null) {
      permissionListener.onRequestPermissionsResult(requestCode, permissions, grantResults);
    }
    permissionListener = null;
  }
}
