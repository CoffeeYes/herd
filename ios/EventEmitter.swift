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
      return []
  }
}
