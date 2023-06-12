import Foundation
import CoreBluetooth

@objc(HerdBluetoothModule)
class HerdBluetoothModule : NSObject, CBCentralManagerDelegate {
    
    var currentManagerState : CBManagerState?;
    func centralManagerDidUpdateState(_ central: CBCentralManager) {
      print("CBCentralManager initialized");
      
      currentManagerState = central.state;
      print("CBCentralManager State is : \(central.state)")
    }
  
    var manager : CBCentralManager?
    override init() {
        super.init()
        manager = CBCentralManager(delegate: self,queue : nil, options : nil);
    }
    
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
        resolve(currentManagerState == CBManagerState.poweredOn)
    }

    @objc
    func checkBTPermissions(_ resolve : RCTPromiseResolveBlock,
    reject : RCTPromiseRejectBlock) {
        resolve(false)
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
