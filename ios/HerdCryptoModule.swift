import Foundation

@objc(HerdCryptoModule)
class HerdCryptoModule : NSObject {
  @objc
  func generateRSAKeyPair(_ alias : String, resolve : RCTPromiseResolveBlock, reject : RCTPromiseRejectBlock) {
      let attributes : [String : Any] = [
            kSecAttrKeyType as String : kSecAttrKeyTypeRSA,
            kSecAttrKeySizeInBits as String : 2048,
            kSecPrivateKeyAttrs as String: [
                kSecAttrIsPermanent as String:    true,
                kSecAttrApplicationTag as String: alias
            ]
      ]
      var error : Unmanaged<CFError>?
      guard let privateKey = SecKeyCreateRandomKey(attributes as CFDictionary, &error) else {
          return resolve(false);
      }
      resolve(true);
  }
  @objc
  func deleteKeyPair(_ alias : String, resolve : RCTPromiseResolveBlock, reject : RCTPromiseRejectBlock) {
      resolve(nil);
  }
  @objc
  func loadKeyFromKeystore(_ alias : String, resolve : RCTPromiseResolveBlock, reject : RCTPromiseRejectBlock) {
    let getquery: [String: Any] = [
        kSecClass as String: kSecClassKey,
        kSecAttrApplicationTag as String: alias,
        kSecAttrKeyType as String: kSecAttrKeyTypeRSA,
        kSecReturnRef as String: true
    ]
    var storedKey: CFTypeRef?
    let status = SecItemCopyMatching(getquery as CFDictionary, &storedKey)
    guard status == errSecSuccess else { return resolve("error getting private key") }
    let privateKey = storedKey as! SecKey
    let publicKey = SecKeyCopyPublicKey(privateKey);
    let publicKeyData = SecKeyCopyExternalRepresentation(publicKey!,nil)
    let finalPublicKeyData = publicKeyData! as Data;
    resolve(finalPublicKeyData.base64EncodedString());
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
