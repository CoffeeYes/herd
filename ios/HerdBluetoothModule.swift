import Foundation

@objc(HerdBluetoothModule)
class HerdBluetoothModule : NSObject {
  @objc
  func scanForDevices(_ resolve : RCTPromiseResolveBlock,
  reject : RCTPromiseRejectBlock) {
      resolve(false)
  }
  @objc
  func cancelScanForDevices(_ resolve : RCTPromiseResolveBlock,
  reject : RCTPromiseRejectBlock) {
      resolve(false)
  }
  @objc
  func checkBTEnabled(_ resolve : RCTPromiseResolveBlock,
  reject : RCTPromiseRejectBlock) {
      resolve(false)
  }
  @objc
  func checkForBTAdapter(_ resolve : RCTPromiseResolveBlock,
  reject : RCTPromiseRejectBlock) {
      resolve(false)
  }
  @objc
  func requestBTEnable(_ resolve : RCTPromiseResolveBlock,
  reject : RCTPromiseRejectBlock) {
      resolve(false)
  }
  @objc
  func requestBTMakeDiscoverable(_ duration : Int,
  resolve : RCTPromiseResolveBlock,
  reject : RCTPromiseRejectBlock) {
      resolve(false)
  }
  @objc
  func checkLocationPermission(_ resolve : RCTPromiseResolveBlock,
  reject : RCTPromiseRejectBlock) {
      resolve(false)
  }
  @objc
  func requestLocationPermissions(_ resolve : RCTPromiseResolveBlock,
  reject : RCTPromiseRejectBlock) {
      resolve(false)
  }
  @objc
  func checkLocationEnabled(_ resolve : RCTPromiseResolveBlock,
  reject : RCTPromiseRejectBlock) {
      resolve(false)
  }
  @objc
  func requestLocationEnable(_ resolve : RCTPromiseResolveBlock,
  reject : RCTPromiseRejectBlock) {
      resolve(false)
  }
  @objc
  func writeToBTConnection(_ value : String,
  resolve : RCTPromiseResolveBlock,
  reject : RCTPromiseRejectBlock) {
      resolve(false)
  }
  @objc
  func cancelBTConnectionThread() {

  }
  @objc
  func listenAsServer(_ resolve : RCTPromiseResolveBlock,
  reject : RCTPromiseRejectBlock) {
      resolve(false)
  }
  @objc
  func cancelListenAsServer(_ resolve : RCTPromiseResolveBlock,
  reject : RCTPromiseRejectBlock) {
      resolve(false)
  }
  @objc
  func connectAsClient(_ resolve : RCTPromiseResolveBlock,
  reject : RCTPromiseRejectBlock) {
      resolve(false)
  }
  @objc
  func cancelConnectAsClient(_ resolve : RCTPromiseResolveBlock,
  reject : RCTPromiseRejectBlock) {
      resolve(false)
  }
}
