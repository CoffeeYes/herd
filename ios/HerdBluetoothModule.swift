import Foundation
import CoreBluetooth
import CoreLocation

@objc(HerdBluetoothModule)
class HerdBluetoothModule : NSObject, CBCentralManagerDelegate {
  
  @objc
  func constantsToExport() -> [String : Any] {
    return [
      "bluetoothStates" : [
        "STATE_CONNECTED" : "STATE_CONNECTED"
      ]
    ]
  }
    
    var currentManagerState : CBManagerState?;
    func centralManagerDidUpdateState(_ central: CBCentralManager) {
      print("CBCentralManager initialized");
      
      currentManagerState = central.state;
      print("CBCentralManager State is : \(central.state)")
    }
  
    var bluetoothManager : CBCentralManager?
    var locationManager : CLLocationManager?
    override init() {
        super.init()
        bluetoothManager = CBCentralManager(delegate: self,queue : nil, options : nil);
        locationManager = CLLocationManager();
    }
    
    @objc
    func scanForDevices(_ resolve : RCTPromiseResolveBlock,
    reject : RCTPromiseRejectBlock) {
        bluetoothManager?.scanForPeripherals(withServices : nil);
        resolve(true);
    }
    @objc
    func cancelScanForDevices(_ resolve : RCTPromiseResolveBlock,
    reject : RCTPromiseRejectBlock) {
        if(bluetoothManager?.isScanning != nil) {
            bluetoothManager?.stopScan();
        }
        resolve(true);
    }

    @objc
    func checkBTEnabled(_ resolve : RCTPromiseResolveBlock,
    reject : RCTPromiseRejectBlock) {
        resolve(currentManagerState == CBManagerState.poweredOn)
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
    func checkForBTAdapter(_ resolve : RCTPromiseResolveBlock,
    reject : RCTPromiseRejectBlock) {
      resolve(currentManagerState == CBManagerState.poweredOn || currentManagerState ==  CBManagerState.poweredOff)
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
    func checkLocationEnabled(_ resolve : RCTPromiseResolveBlock,
    reject : RCTPromiseRejectBlock) {
        resolve(checkLocationIsAuthorized())
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
