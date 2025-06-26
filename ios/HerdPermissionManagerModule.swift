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
    func checkBTPermissions(_ resolve : RCTPromiseResolveBlock,
    reject : RCTPromiseRejectBlock) {
        resolve(CBCentralManager.authorization == .allowedAlways)
    }
    @objc
    func requestBTPermissions(_ resolve : RCTPromiseResolveBlock,
    reject : RCTPromiseRejectBlock) {
        resolve(false)
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
    func requestNotificationPermissions(_ resolve : RCTPromiseResolveBlock,
    reject : RCTPromiseRejectBlock) {
        resolve(false)
    }

    @objc
    func navigateToSettings(_ resolve : RCTPromiseResolveBlock,
    reject : RCTPromiseRejectBlock) {
        resolve(false)
    }
}
