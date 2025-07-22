import Foundation
import React

@objc(EventEmitter)
class EventEmitter : RCTEventEmitter {
  
  public static var emitter : EventEmitter?

  override init() {
    super.init()
    EventEmitter.emitter = self
  }
  
  private static var emitterStrings = [String]();
  
  static func registerEmitterEvents(events : [String]) {
    emitterStrings.append(contentsOf: events)
  }
  
  @objc
  override func supportedEvents() -> [String] {
    return EventEmitter.emitterStrings
  }
}
