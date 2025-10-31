import Foundation
import React

@objc(EventEmitter)
class EventEmitter : RCTEventEmitter {
  
  public static var emitter : RCTEventEmitter!;

  override init() {
    super.init()
    EventEmitter.emitter = self;
  }
  
  @objc
  override static func requiresMainQueueSetup() -> Bool {
    return false;
  }
  
  private static var emitterStrings = [String]();
  
  static func registerEmitterEvents(events : [String]) {
    emitterStrings.append(contentsOf: events)
  }
  
  @objc
  override func supportedEvents() -> [String] {
    return EventEmitter.emitterStrings
  }
  
  
  @objc
  override func addListener(_ eventName: String!) {
    super.addListener(eventName);
    print("[EventEmitter] added listener, eventName : \(eventName!)");
  }
  
  @objc
  override func removeListeners(_ count: Double) {
    super.removeListeners(count);
    print("[EventEmitter] Removed Listeners, new count : \(count)");
  }
}
