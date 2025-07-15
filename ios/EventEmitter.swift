import Foundation
import React

@objc(EventEmitter)
class EventEmitter : RCTEventEmitter {
  
  public static var emitter : EventEmitter?
  
  override init() {
    super.init()
    EventEmitter.emitter = self
  }
  
  @objc
  override func supportedEvents() -> [String] {
      return [
        HerdServiceInterfaceModule.emitterStrings.NEW_MESSAGES_RECEIVED.rawValue,
        HerdServiceInterfaceModule.emitterStrings.REMOVE_MESSAGES_FROM_QUEUE.rawValue,
        HerdServiceInterfaceModule.emitterStrings.BLUETOOTH_LOCATION_STATE_CHANGE.rawValue,
        HerdBluetoothModule.emitterStrings.NEW_BT_DEVICE.rawValue,
        HerdBluetoothModule.emitterStrings.DISCOVERY_STATE_CHANGE.rawValue,
        HerdBluetoothModule.emitterStrings.CONNECTION_STATE_CHANGE.rawValue,
        HerdBluetoothModule.emitterStrings.NEW_MESSAGE.rawValue,
      ]
  }
}
