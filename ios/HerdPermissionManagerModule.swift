import Foundation
import CoreBluetooth
import CoreLocation

@objc(HerdPermissionManagerModule)
class HerdPermissionManagerModule : NSObject {
  
    var locationManager : CLLocationManager?
    override init() {
      super.init();
      locationManager = CLLocationManager();
    }
    
    @objc
    func constantsToExport() -> [String : Any] {
      return [
        "navigationTargets" : [
          "settings" : UIApplication.openSettingsURLString,
          "notificationSettings" : "",
          "locationSettings" : ""
        ]
      ]
    }

    @objc
    func checkBTPermissions(_ resolve : RCTPromiseResolveBlock,
    reject : RCTPromiseRejectBlock) {
        resolve(CBCentralManager.authorization == .allowedAlways)
    }
  
    @objc
    func requestBTPermissions(_ resolve : RCTPromiseResolveBlock,
    reject : RCTPromiseRejectBlock) {
      resolve(CBCentralManager.authorization == .allowedAlways)
    }

    @objc
    func checkLocationPermission(_ resolve : RCTPromiseResolveBlock,
    reject : RCTPromiseRejectBlock) {
      resolve(checkLocationIsAuthorized())
    }

    func checkLocationIsAuthorized() -> Bool {
        return locationManager?.authorizationStatus == CLAuthorizationStatus.authorizedAlways ||
        locationManager?.authorizationStatus == CLAuthorizationStatus.authorizedWhenInUse
    }

    @objc
    func requestLocationPermissions(_ resolve : RCTPromiseResolveBlock,
    reject : RCTPromiseRejectBlock) {
        var authorized = checkLocationIsAuthorized();
        if(!authorized) {
          locationManager?.requestAlwaysAuthorization();
          authorized = checkLocationIsAuthorized();
        }
        resolve(authorized)
    }

    @objc
  func requestNotificationPermissions(_ resolve : @escaping RCTPromiseResolveBlock,
    reject : RCTPromiseRejectBlock) {
      let center = UNUserNotificationCenter.current();
      center.requestAuthorization(options: [.alert, .badge, .sound]) { (granted, error) in
        if let error = error {
          print("Error requesting notification permission: \(error)")
        }
        resolve(granted)
      }
    }

    @objc
  func navigateToSettings(_ navigationTarget : String,
    resolve : RCTPromiseResolveBlock,
    reject : RCTPromiseRejectBlock) {
      resolve(false)
    }
}
