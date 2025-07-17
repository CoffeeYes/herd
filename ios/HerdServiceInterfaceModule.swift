import Foundation

@objc(HerdServiceInterfaceModule)
class HerdServiceInterfaceModule : NSObject {
  
  enum emitterStrings : String {
    case NEW_MESSAGES_RECEIVED = "newHerdMessagesReceived"
    case REMOVE_MESSAGES_FROM_QUEUE = "removeMessagesFromQueue"
    case BLUETOOTH_LOCATION_STATE_CHANGE = "bluetoothOrLocationStateChange"
  }
  
  enum storageStrings : String {
    case SAVED_MESSAGE_QUEUE = "savedMessageQueue"
    case SAVED_MESSAGE_QUEUE_SIZES = "savedMessageQueueSizes"
    case MESSAGES_TO_REMOVE = "messagesToRemove"
    case MESSAGES_TO_REMOVE_SIZES = "messagesToRemoveSizes"
  }
  
  enum bluetoothErrors : String {
    case LOCATION_DISABLED,ADAPTER_TURNED_OFF
  }
  
  enum messageTypes : String {
    case COMPLETED_MESSAGES = "completed"
    case RECEIVED_MESSAGES = "received"
  }
  
  @objc
  func constantsToExport() -> [String : Any] {
    return [
      "emitterStrings" : [
        "NEW_MESSAGES_RECEIVED" : emitterStrings.NEW_MESSAGES_RECEIVED.rawValue,
        "REMOVE_MESSAGES_FROM_QUEUE" : emitterStrings.REMOVE_MESSAGES_FROM_QUEUE.rawValue,
        "BLUETOOTH_LOCATION_STATE_CHANGE" : emitterStrings.BLUETOOTH_LOCATION_STATE_CHANGE.rawValue
      ],
      "storage" : [
        "SAVED_MESSAGE_QUEUE" : storageStrings.SAVED_MESSAGE_QUEUE.rawValue,
        "SAVED_MESSAGE_QUEUE_SIZES" : storageStrings.SAVED_MESSAGE_QUEUE_SIZES.rawValue,
        "MESSAGES_TO_REMOVE" : storageStrings.MESSAGES_TO_REMOVE.rawValue,
        "MESSAGES_TO_REMOVE_SIZES" : storageStrings.MESSAGES_TO_REMOVE_SIZES.rawValue,
      ],
      "bluetoothErrors" : [
        "LOCATION_DISABLED" : bluetoothErrors.LOCATION_DISABLED.rawValue,
        "ADAPTER_TURNED_OFF" : bluetoothErrors.ADAPTER_TURNED_OFF.rawValue,
      ],
      "messageTypes" : [
        "COMPLETED_MESSAGES" : messageTypes.COMPLETED_MESSAGES.rawValue,
        "RECEIVED_MESSAGES" : messageTypes.RECEIVED_MESSAGES.rawValue
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
  func setAllowNotifications(_ allow : Bool) {

  }
  
  @objc
  func notificationsAreEnabled(_ resolve : @escaping RCTPromiseResolveBlock,
    reject : RCTPromiseRejectBlock) {
    UNUserNotificationCenter.current().getNotificationSettings { settings in
      resolve(settings.authorizationStatus == .authorized)
    }
  }


  @objc
  func notificationIsPending(_ notificationID: Int,
  resolve : RCTPromiseResolveBlock,
  reject : RCTPromiseRejectBlock) {
      resolve(false)
  }

  @objc
  func sendNotification(_ title : String,
  text : String,
  resolve : RCTPromiseResolveBlock,
  reject : RCTPromiseRejectBlock) {
      resolve(false)
  }
  
  @objc
  func updateNotification(_ title : String,
  text : String,
  notificationID : Int,
  resolve : RCTPromiseResolveBlock,
  reject : RCTPromiseRejectBlock) {
      resolve(false)
  }
  
  @objc
  func isBound() -> Bool {
    return false;
  }
}
