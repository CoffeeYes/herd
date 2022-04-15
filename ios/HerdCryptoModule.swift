import Foundation

@objc(HerdCryptoModule)
class HerdCryptoModule : NSObject {
  @objc
  func generateRSAKeyPair(_ alias : String, resolve : RCTPromiseResolveBlock, reject : RCTPromiseRejectBlock) {
      resolve(nil);
  }
  @objc
  func deleteKeyPair(_ alias : String, resolve : RCTPromiseResolveBlock, reject : RCTPromiseRejectBlock) {
      resolve(nil);
  }
  @objc
  func loadKeyFromKeystore(_ alias : String, resolve : RCTPromiseResolveBlock, reject : RCTPromiseRejectBlock) {
      resolve(nil);
  }
  @objc
  func encryptString(_ alias : String,
  algorithm : String,
  blockmode : String,
  padding : String,
  stringToEncrypt : String,
  resolve : RCTPromiseResolveBlock,
  reject : RCTPromiseRejectBlock) {
      resolve(nil);
  }
  @objc
  func decryptString(_ alias : String,
  algorithm : String,
  blockmode : String,
  padding : String,
  stringToDecrypt : String,
  resolve : RCTPromiseResolveBlock,
  reject : RCTPromiseRejectBlock) {
      resolve(nil);
  }

  @objc
  func encryptStringWithKey(_ key : String,        
  algorithm : String,
  blockmode : String,
  padding : String,
  stringToEncrypt : String,
  resolve : RCTPromiseResolveBlock,
  reject : RCTPromiseRejectBlock) {
      resolve(nil);
    }
}
