import Foundation
import CoreBluetooth
import CoreLocation

@objc(HerdBluetoothModule)
class HerdBluetoothModule : NSObject, CBCentralManagerDelegate {
  
  enum emitterStrings : String {
    case NEW_BT_DEVICE = "newBTDeviceFound"
    case DISCOVERY_STATE_CHANGE = "BTStateChange"
    case CONNECTION_STATE_CHANGE = "BTConnectionStateChange"
    case NEW_MESSAGE = "newBTMessageReceived"
  }

  enum discoveryEvents : String {
    case DISCOVERY_STARTED,DISCOVERY_FINISHED
  }

  enum bluetoothStates : String {
    case STATE_CONNECTED,STATE_DISCONNECTED
  }
  
  @objc
  func constantsToExport() -> [String : Any] {
    return [
      "emitterStrings" : [
        "NEW_BT_DEVICE" : emitterStrings.NEW_BT_DEVICE.rawValue,
        "DISCOVERY_STATE_CHANGE" : emitterStrings.DISCOVERY_STATE_CHANGE.rawValue,
        "CONNECTION_STATE_CHANGE" : emitterStrings.CONNECTION_STATE_CHANGE.rawValue,
        "NEW_MESSAGE" : emitterStrings.NEW_MESSAGE.rawValue
      ],
      "discoveryEvents" : [
        //needs to be changed down the line in android and IOS as current android implementation
        //uses android-only strings from BluetoothAdapter class
        "DISCOVERY_STARTED" : discoveryEvents.DISCOVERY_STARTED.rawValue,
        "DISCOVERY_FINISHED" : discoveryEvents.DISCOVERY_FINISHED.rawValue
      ],
      "bluetoothStates" : [
        "STATE_CONNECTED" : bluetoothStates.STATE_CONNECTED,
        "STATE_DISCONNECTED" : bluetoothStates.STATE_DISCONNECTED
      ]
    ]
  }
  
  let CBManagerStates : [CBManagerState : String] = [
    .poweredOn : "poweredOn",
    .poweredOff : "poweredOff",
    .unauthorized : "unauthorized",
    .unsupported : "unsupported",
    .unknown : "unknown"
  ]
  
  var currentManagerState : CBManagerState?;
  func centralManagerDidUpdateState(_ central: CBCentralManager) {
    currentManagerState = central.state;
    print("CBCentralManager State is : \(CBManagerStates[currentManagerState!] ?? "not defined in CBManagerStates")")
    
    if(central.state == .poweredOff) {
      EventEmitter.emitter?.sendEvent(
        withName: HerdServiceInterfaceModule.emitterStrings.BLUETOOTH_LOCATION_STATE_CHANGE.rawValue,
        body: HerdServiceInterfaceModule.bluetoothErrors.ADAPTER_TURNED_OFF.rawValue)
    }
  }
  
  func centralManager(_ central: CBCentralManager, didDiscover peripheral: CBPeripheral, advertisementData: [String : Any], rssi RSSI: NSNumber) {
    EventEmitter.emitter?.sendEvent(
      withName: emitterStrings.NEW_BT_DEVICE.rawValue,
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
      EventEmitter.registerEmitterEvents(events: [
        HerdBluetoothModule.emitterStrings.NEW_BT_DEVICE.rawValue,
        HerdBluetoothModule.emitterStrings.DISCOVERY_STATE_CHANGE.rawValue,
        HerdBluetoothModule.emitterStrings.CONNECTION_STATE_CHANGE.rawValue,
        HerdBluetoothModule.emitterStrings.NEW_MESSAGE.rawValue
      ])
    }
    
    @objc
    func scanForDevices(_ resolve : RCTPromiseResolveBlock,
    reject : RCTPromiseRejectBlock) {
      bluetoothManager?.scanForPeripherals(withServices : nil);
      let scanning = bluetoothManager?.isScanning
      if(scanning!) {
        EventEmitter.emitter?.sendEvent(withName: emitterStrings.DISCOVERY_STATE_CHANGE.rawValue, body: discoveryEvents.DISCOVERY_STARTED.rawValue)
        DispatchQueue.main.asyncAfter(deadline: .now() + 15) {
          self.bluetoothManager?.stopScan();
          EventEmitter.emitter?.sendEvent(withName: emitterStrings.DISCOVERY_STATE_CHANGE.rawValue, body: discoveryEvents.DISCOVERY_FINISHED.rawValue)
        }
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
      EventEmitter.emitter?.sendEvent(withName: emitterStrings.DISCOVERY_STATE_CHANGE.rawValue, body: discoveryEvents.DISCOVERY_FINISHED.rawValue)
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
      resolve(currentManagerState != CBManagerState.unknown && currentManagerState !=  CBManagerState.unsupported)
    }
  
    @objc
    func requestBTEnable(_ resolve : RCTPromiseResolveBlock,
    reject : RCTPromiseRejectBlock) {
      if(currentManagerState == .poweredOn) {
        resolve(true)
      }
      else {
        bluetoothManager = CBCentralManager(delegate: self,queue : nil, options : nil);
        resolve(currentManagerState == .poweredOn)
      }
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
      resolve(true)
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
