import Foundation

@objc(HerdServiceInterfaceModule)
class HerdServiceInterfaceModule : NSObject {
  
  @objc
  func constantsToExport() -> [String : Any] {
    return [
      "emitterStrings" : [
        "NEW_MESSAGES_RECEIVED" : "newHerdMessagesReceived",
        "REMOVE_MESSAGES_FROM_QUEUE" : "removeMessagesFromQueue",
        "BLUETOOTH_LOCATION_STATE_CHANGE" : "bluetoothOrLocationStateChange",
      ],
      "storage" : [
        "SAVED_MESSAGE_QUEUE" : "savedMessageQueue",
        "SAVED_MESSAGE_QUEUE_SIZES" : "savedMessageQueueSizes",
        "MESSAGES_TO_REMOVE" : "messagesToRemove",
        "MESSAGES_TO_REMOVE_SIZES" : "messagesToRemoveSizes"
      ],
      "bluetoothErrors" : [
        "LOCATION_DISABLED" : "LOCATION_DISABLED",
        "ADAPTER_TURNED_OFF" : "ADAPTER_TURNED_OFF",
      ],
      "messageTypes" : [
        "COMPLETED_MESSAGES" : "completed",
        "RECEIVED_MESSAGES" : "received"
      ],
    ]
  }
  
  @objc
  func isRunning(_ resolve : RCTPromiseResolveBlock,
  reject : RCTPromiseRejectBlock) {
      resolve(false)
  }
  @objc
  func addMessageToService(_ message : NSDictionary,
  resolve : RCTPromiseResolveBlock,
  reject : RCTPromiseRejectBlock) {
      resolve(false)
  }
  @objc
  func removeMessagesFromService(_ messages : NSArray,
  resolve : RCTPromiseResolveBlock,
  reject : RCTPromiseRejectBlock) {
      resolve(false)
  }
  @objc
  func addDeletedMessagesToService(_ messages : NSArray,
  resolve : RCTPromiseResolveBlock,
  reject : RCTPromiseRejectBlock) {
      resolve(false)
  }
  @objc
  func getReceivedMessages(_ resolve : RCTPromiseResolveBlock,
  reject : RCTPromiseRejectBlock) {
      let messages = [NSDictionary]();
      resolve(messages)
  }
  @objc
  func getCompletedMessages(_ resolve : RCTPromiseResolveBlock,
  reject : RCTPromiseRejectBlock) {
      let messages = [NSDictionary]();
      resolve(messages)
  }
  @objc
  func getStoredMessages(_ filename : String,
  sizesFilename : String,
  resolve : RCTPromiseResolveBlock,
  reject : RCTPromiseRejectBlock) {
      resolve(false)
  }
  @objc
  func disableService() {
      
  }
  
  @objc
  func setFrontendRunning(_ running : Bool) {
    
  }
  
  @objc
  func notificationsAreEnabled(_ resolve : @escaping RCTPromiseResolveBlock,
    reject : RCTPromiseRejectBlock) {
    UNUserNotificationCenter.current().getNotificationSettings { settings in
      resolve(settings.authorizationStatus == .authorized)
    }
  }
  
  @objc
  func isBound() -> Bool {
    return false;
  }
}
