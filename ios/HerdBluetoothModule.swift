import Foundation
import CoreBluetooth
import CoreLocation

@objc(HerdBluetoothModule)
class HerdBluetoothModule : NSObject, CBCentralManagerDelegate {
  
  @objc
  func constantsToExport() -> [String : Any] {
    return [
      "emitterStrings" : [
        "NEW_BT_DEVICE" : "newBTDeviceFound",
        "DISCOVERY_STATE_CHANGE" : "BTStateChange",
        "CONNECTION_STATE_CHANGE" : "BTConnectionStateChange",
        "NEW_MESSAGE" : "newBTMessageReceived"
      ],
      "discoveryEvents" : [
        //needs to be changed down the line in android and IOS as current android implementation
        //uses android-only strings from BluetoothAdapter class
        "DISCOVERY_STARTED" : "DISCOVERY_STARTED",
        "DISCOVERY_FINISHED" : "DISCOVERY_FINISHED"
      ],
      "bluetoothStates" : [
        "STATE_CONNECTED" : "STATE_CONNECTED",
        "STATE_DISCONNECTED" : "STATE_DISCONNECTED"
      ]
    ]
  }
    
    var currentManagerState : CBManagerState?;
    func centralManagerDidUpdateState(_ central: CBCentralManager) {
      print("CBCentralManager initialized");
      
      currentManagerState = central.state;
      print("CBCentralManager State is : \(central.state)")
    }
  
  func centralManager(_ central: CBCentralManager, didDiscover peripheral: CBPeripheral, advertisementData: [String : Any], rssi RSSI: NSNumber) {
    EventEmitter.emitter?.sendEvent(
      withName: "newBTDeviceFound",
      body: [
        "name" : peripheral.name ?? "Unknown Device"
      ]
    )
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
      let scanning = bluetoothManager?.isScanning
      if(scanning!) {
        EventEmitter.emitter?.sendEvent(withName: "btStateChange", body: "DISCOVERY_STARTED")
      }
      resolve(scanning);
    }

    @objc
    func cancelScanForDevices(_ resolve : RCTPromiseResolveBlock,
    reject : RCTPromiseRejectBlock) {
      let scanning = bluetoothManager?.isScanning;
      if(scanning!) {
          bluetoothManager?.stopScan();
      }
      EventEmitter.emitter?.sendEvent(withName: "btStateChange", body: "DISCOVERY_FINISHED")
      resolve(true);
    }

    @objc
    func checkBTEnabled(_ resolve : RCTPromiseResolveBlock,
    reject : RCTPromiseRejectBlock) {
        resolve(currentManagerState == CBManagerState.poweredOn)
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
    func checkLocationEnabled(_ resolve : RCTPromiseResolveBlock,
    reject : RCTPromiseRejectBlock) {
        resolve(HerdPermissionManagerModule().checkLocationIsAuthorized())
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
