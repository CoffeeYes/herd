package com.reactnativecrypto

import android.graphics.Color
import android.view.View
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp

class CryptoViewManager : SimpleViewManager<View>() {
  override fun getName() = "CryptoView"

  override fun createViewInstance(reactContext: ThemedReactContext): View {
    return View(reactContext)
  }
}
