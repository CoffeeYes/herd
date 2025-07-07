import Foundation
import React

@objc(EventEmitter)
class EventEmitter : RCTEventEmitter {
  
  @objc
  override func supportedEvents() -> [String] {
      return []
  }
}
