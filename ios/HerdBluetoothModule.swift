import Foundation
import CoreBluetooth
import CoreLocation

@objc(HerdBluetoothModule)
class HerdBluetoothModule : NSObject, CBCentralManagerDelegate, CLLocationManagerDelegate, CBPeripheralDelegate {
  
  let asyncQueue = DispatchQueue(label:"com.herd.bluetooth.queue");
  let peripheralManager = CBPeripheralManager();
  
  private var targetDeviceForConnection : CBPeripheral? = nil;
  
  enum emitterStrings : String {
    case NEW_BT_DEVICE = "newBTDeviceFound"
    case DISCOVERY_STATE_CHANGE = "BTStateChange"
    case CONNECTION_STATE_CHANGE = "BTConnectionStateChange"
    case NEW_DATA_FROM_CONNECTION = "BTNewDataFromConnection"
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
        "NEW_DATA_FROM_CONNECTION" : emitterStrings.NEW_DATA_FROM_CONNECTION.rawValue
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
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return true;
  }
  
  func sendBTPeripheralDisconnectEvent() {
    EventEmitter.emitter.sendEvent(
      withName: emitterStrings.CONNECTION_STATE_CHANGE.rawValue,
      body: bluetoothStates.STATE_DISCONNECTED.rawValue
    )
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
    //only send turned_off event if transition is from on->off, currentManager state = previous manager state at this point
    if(currentManagerState == .poweredOn && central.state == .poweredOff) {
      EventEmitter.emitter.sendEvent(
        withName: HerdServiceInterfaceModule.emitterStrings.BLUETOOTH_LOCATION_STATE_CHANGE.rawValue,
        body: HerdServiceInterfaceModule.bluetoothErrors.ADAPTER_TURNED_OFF.rawValue)
    }
    currentManagerState = central.state;
    print("CBCentralManager State is : \(CBManagerStates[currentManagerState!] ?? "not defined in CBManagerStates")")
  }
  
  private var discoveredPeripherals : [UUID : CBPeripheral] = [:];
  func centralManager(_ central: CBCentralManager, didDiscover peripheral: CBPeripheral, advertisementData: [String : Any], rssi RSSI: NSNumber) {
    let name = peripheral.name
    discoveredPeripherals[peripheral.identifier] = peripheral;
    EventEmitter.emitter.sendEvent(
      withName: emitterStrings.NEW_BT_DEVICE.rawValue,
      body: [
        "name" : peripheral.name ?? "N/A",
        "identifier" : peripheral.identifier.uuidString
      ]
    )
  }
  
  func centralManager(_ central: CBCentralManager, didConnect peripheral: CBPeripheral) {
    print("connected to peripheral, name : \(peripheral.name ?? "no name"), identifier : \(peripheral.identifier.uuidString)");
    if(peripheral == targetDeviceForConnection) {
      EventEmitter.emitter.sendEvent(
        withName: emitterStrings.CONNECTION_STATE_CHANGE.rawValue,
        body: bluetoothStates.STATE_CONNECTED.rawValue
      )
    }
    peripheral.discoverServices([CBUUID(string : bleUUIDs.peripheralUserDataServiceUUID)]);
    peripheral.delegate = self;
  }
  
  func centralManager(_ central: CBCentralManager, didDisconnectPeripheral peripheral: CBPeripheral, error: Error?) {
    if(error != nil) {
      print("Error during peripheral disconnection \(String(describing: error))");
      handlePeripheralError(peripheral);
      return;
    }
    print("disconnected from peripheral, name : \(peripheral.name ?? "no name"), identifier : \(peripheral.identifier.uuidString)");
    if(peripheral == targetDeviceForConnection) {
      sendBTPeripheralDisconnectEvent();
    }
  }
  
  func handlePeripheralError(_ peripheral : CBPeripheral) {
    bluetoothManager?.cancelPeripheralConnection(peripheral);
    sendBTPeripheralDisconnectEvent();
    peripheralManager.stopAdvertising();
  }
  
  func peripheral(_ peripheral : CBPeripheral, didDiscoverServices error : Error?) {
    if(error != nil) {
      print("Error discovering services \(String(describing: error))");
      handlePeripheralError(peripheral);
      return;
    }
    print("Discovered services \(String(describing: peripheral.services))");
    
    if let targetService = peripheral.services?.first(where : {$0.uuid.uuidString == bleUUIDs.peripheralUserDataServiceUUID}) {
      peripheral.discoverCharacteristics(
        [CBUUID(string : bleUUIDs.peripheralPublicKeyCharacteristicUUID)],
        for: targetService
      )
    }
  }
  
  func peripheral(_ peripheral: CBPeripheral, didUpdateValueFor characteristic: CBCharacteristic, error: (any Error)?) {
    if(error != nil) {
      print("Error discovering services \(String(describing: error))");
      handlePeripheralError(peripheral);
      return;
    }
    if(characteristic.uuid.uuidString == bleUUIDs.peripheralPublicKeyCharacteristicUUID) {
      let publicKeyData = characteristic.value! as Data;
      let publicKeyString = String(decoding: publicKeyData, as: Unicode.UTF8.self);
      print("read public key from characteristic \(publicKeyString)");
      EventEmitter.emitter.sendEvent(withName: emitterStrings.NEW_DATA_FROM_CONNECTION.rawValue, body: ["key" : publicKeyString])
    }
  }
  
  func peripheral(_ peripheral : CBPeripheral, didDiscoverCharacteristicsFor service : CBService, error : Error?) {
    if(error != nil) {
      print("Error discovering characteristics \(String(describing: error))");
      handlePeripheralError(peripheral);
      return;
    }
    print("Discovered characteristics \(String(describing: service.characteristics))");
    if let publicKeyCharacteristic = service.characteristics?.first(where: {$0.uuid.uuidString == bleUUIDs.peripheralPublicKeyCharacteristicUUID}) {
      peripheral.readValue(for: publicKeyCharacteristic)
    }
  }
  
  func peripheral(_ peripheral: CBPeripheral, didReceiveReadRequest request : CBATTRequest) {
    if(request.characteristic.uuid.uuidString == bleUUIDs.peripheralPublicKeyCharacteristicUUID) {
      peripheralManager.respond(to: request, withResult: CBATTError.success)
    }
  }
 
  func bleStartAdvertising(publicKey : String) {
    let publicKeyCharacteristic = CBMutableCharacteristic(
      type: CBUUID(string: bleUUIDs.peripheralPublicKeyCharacteristicUUID),
      properties: [.read],
      value: Data(publicKey.utf8),
      permissions: .readable
    );
    
    let HerdUserDataService = CBMutableService(
      type: CBUUID(string: bleUUIDs.peripheralUserDataServiceUUID),
      primary: true
    );
    
    HerdUserDataService.characteristics = [publicKeyCharacteristic];
    
    peripheralManager.add(HerdUserDataService)
    peripheralManager.startAdvertising([
      CBAdvertisementDataLocalNameKey : UIDevice.current.name,
      CBAdvertisementDataServiceUUIDsKey : [CBUUID(string: bleUUIDs.peripheralScanServiceUUID)]
    ])
  }
  
  let CLLocationStates : [CLAuthorizationStatus : String] = [
    .authorizedAlways : "authorizedAlways",
    .authorizedWhenInUse : "authorizedWhenInUse",
    .denied : "denied",
    .notDetermined : "notDetermined",
    .restricted : "restricted",
  ]
  
    var bluetoothManager : CBCentralManager?
    var locationManager : CLLocationManager?
    var locationEnabled = false;
    override init() {
      super.init()
      bluetoothManager = CBCentralManager(delegate: self,queue : nil, options : nil);
      locationManager = CLLocationManager();
      locationManager?.delegate = self;
      EventEmitter.registerEmitterEvents(events: [
        HerdBluetoothModule.emitterStrings.NEW_BT_DEVICE.rawValue,
        HerdBluetoothModule.emitterStrings.DISCOVERY_STATE_CHANGE.rawValue,
        HerdBluetoothModule.emitterStrings.CONNECTION_STATE_CHANGE.rawValue,
        HerdBluetoothModule.emitterStrings.NEW_DATA_FROM_CONNECTION.rawValue
      ])
    }
  
    //see below, .denied is propagated when settings -> privacy -> location is turned off
    //https://developer.apple.com/documentation/corelocation/cllocationmanager/locationservicesenabled()
    func locationManagerDidChangeAuthorization(_ manager : CLLocationManager) {
      print("locationAuthorizationStatus : \(CLLocationStates[manager.authorizationStatus] ?? "unknown")")
      if(manager.authorizationStatus == .denied && locationEnabled) {
        EventEmitter.emitter.sendEvent(
          withName: HerdServiceInterfaceModule.emitterStrings.BLUETOOTH_LOCATION_STATE_CHANGE.rawValue,
          body: HerdServiceInterfaceModule.bluetoothErrors.LOCATION_DISABLED.rawValue
        )
        locationEnabled = false;
      }
      else if([.authorizedAlways,.authorizedWhenInUse,.notDetermined].contains(locationManager?.authorizationStatus)) {
        asyncQueue.async(execute: {
          self.locationEnabled = CLLocationManager.locationServicesEnabled();
        })
      }
    }
    
    @objc
  func scanForBLEDevices(_ scanDuration : Int = 30000,
    publicKey : String,
    resolve : RCTPromiseResolveBlock,
    reject : RCTPromiseRejectBlock) {
      let scanDurationSeconds = Double(scanDuration / 1000);
      discoveredPeripherals = [:];
      bluetoothManager?.scanForPeripherals(withServices : [CBUUID(string: bleUUIDs.peripheralScanServiceUUID)]);
      let scanning = bluetoothManager?.isScanning
      if(scanning!) {
        EventEmitter.emitter.sendEvent(withName: emitterStrings.DISCOVERY_STATE_CHANGE.rawValue, body: discoveryEvents.DISCOVERY_STARTED.rawValue)
        DispatchQueue.main.asyncAfter(deadline: .now() + scanDurationSeconds) {
          self.bluetoothManager?.stopScan();
          EventEmitter.emitter.sendEvent(withName: emitterStrings.DISCOVERY_STATE_CHANGE.rawValue, body: discoveryEvents.DISCOVERY_FINISHED.rawValue)
        }
      }
      bleStartAdvertising(publicKey: publicKey);
      resolve(scanning);
    }

    @objc
    func cancelScanForBLEDevices(_ resolve : RCTPromiseResolveBlock,
    reject : RCTPromiseRejectBlock) {
      let scanning = bluetoothManager?.isScanning;
      if(scanning!) {
          bluetoothManager?.stopScan();
      }
      peripheralManager.stopAdvertising();
      EventEmitter.emitter.sendEvent(withName: emitterStrings.DISCOVERY_STATE_CHANGE.rawValue, body: discoveryEvents.DISCOVERY_FINISHED.rawValue)
      resolve(true);
    }
  
    func getPeripheralFromList(_ peripheralIdentifier : String) -> CBPeripheral? {
      if let deviceUUID = UUID(uuidString: peripheralIdentifier),discoveredPeripherals[deviceUUID] != nil {
        return discoveredPeripherals[deviceUUID];
      }
      else {
        return nil;
      }
    }

    @objc
    func connectToBLEPeripheral(_ peripheralIdentifier : String,
    resolve : RCTPromiseResolveBlock,
    reject : RCTPromiseRejectBlock) {
      if let device = getPeripheralFromList(peripheralIdentifier) {
        if(targetDeviceForConnection != nil && targetDeviceForConnection != device) {
          cancelPeripheralConnection(device);
        }
        targetDeviceForConnection = device;
        bluetoothManager?.connect(device, options: nil);
      }
      else {
        resolve(false)
      }
    }
  
    func cancelPeripheralConnection(_ peripheral : CBPeripheral) {
      if(peripheral.state == .connected) {
        bluetoothManager?.cancelPeripheralConnection(peripheral);
        sendBTPeripheralDisconnectEvent();
      }
    }

    @objc
    func disconnectFromBLEPeripheral(_ peripheralIdentifier : String,
    resolve : RCTPromiseResolveBlock,
    reject : RCTPromiseRejectBlock) {
      if let device = getPeripheralFromList(peripheralIdentifier) {
        cancelPeripheralConnection(device);
        resolve(true);
      }
      else {
        resolve(false);
      }
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
      if(currentManagerState != .poweredOn) {
        bluetoothManager = CBCentralManager(delegate: self,queue : nil, options : nil);
      }
      resolve(currentManagerState == .poweredOn)
    }

    @objc
    func checkLocationEnabled(_ resolve : @escaping RCTPromiseResolveBlock,
    reject : RCTPromiseRejectBlock) {
      //https://developer.apple.com/documentation/corelocation/cllocationmanager/locationservicesenabled()
      asyncQueue.async(execute: {
        resolve(CLLocationManager.locationServicesEnabled())
      })
      //old resolver based on app's location permissions.
      //resolve(HerdPermissionManagerModule().checkLocationIsAuthorized())
    }

    @objc
    func requestLocationEnable(_ resolve : RCTPromiseResolveBlock,
    reject : RCTPromiseRejectBlock) {
      resolve(true)
    }
}
