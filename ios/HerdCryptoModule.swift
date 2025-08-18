import Foundation
import CommonCrypto
import CryptoKit

@objc(HerdCryptoModule)
class HerdCryptoModule : NSObject {
    @objc
    func constantsToExport() -> [String : [String : String]]! {
        return [
            "algorithm" : [
                "RSA" : "RSA",
            ],
            "blockMode" : [
                "ECB" : "ECB",
            ],
            "padding" : [
                "OAEP_SHA256_MGF1Padding" : "OAEPwithSHA-256andMGF1Padding",
            ]
        ]
    }
  
    @objc
    static func requiresMainQueueSetup() -> Bool {
      return true;
    }
  
    let commonKeyAttributes : [String : Any] = [
      kSecAttrKeyType as String : kSecAttrKeyTypeRSA,
      kSecAttrKeySizeInBits as String : 2048,
    ]
  
    @objc
    func generateRSAKeyPair(_ alias : String, resolve : RCTPromiseResolveBlock, reject : RCTPromiseRejectBlock) {
        var attributes = commonKeyAttributes;
        attributes[kSecPrivateKeyAttrs as String] = [
          kSecAttrIsPermanent as String:    true,
          kSecAttrApplicationTag as String: alias
        ]
        var error : Unmanaged<CFError>?
        guard let privateKey = SecKeyCreateRandomKey(attributes as CFDictionary, &error) else {
            return resolve(false);
        }
        resolve(true);
    }
  
    let privateKeyQuery : [String: Any] = [
      kSecClass as String: kSecClassKey,
      kSecAttrKeyType as String: kSecAttrKeyTypeRSA,
      kSecReturnRef as String: true
    ]
  
    @objc
    func deleteKeyPair(_ alias : String, resolve : RCTPromiseResolveBlock, reject : RCTPromiseRejectBlock) {
      var keyQuery = privateKeyQuery;
      keyQuery[kSecAttrApplicationTag as String] = alias;
      
      let deleted = SecItemDelete(keyQuery as CFDictionary);
      resolve(deleted == errSecSuccess);
    }

    func loadRSAPrivateKey(_ alias : String) -> SecKey? {
      var keyQuery = privateKeyQuery;
      keyQuery[kSecAttrApplicationTag as String] = alias;
      
      var storedKey: CFTypeRef?
      let status = SecItemCopyMatching(keyQuery as CFDictionary, &storedKey)
      guard status == errSecSuccess else {
        NSLog("Error getting private RSA key from enclave")
        return nil;
      }
      let privateKey = storedKey as! SecKey
      return privateKey
    }

    func loadRSAPublicKey(_ alias : String) -> SecKey? {
        let privateKey = loadRSAPrivateKey(alias)
        if(privateKey != nil) {
            let publicKey = SecKeyCopyPublicKey(privateKey!);
            return publicKey;
        }
        else {
            return nil;
        }
    }

    @objc
    func loadKeyFromKeystore(_ alias : String, resolve : RCTPromiseResolveBlock, reject : RCTPromiseRejectBlock) {
        let publicKey = loadRSAPublicKey(alias);
        if(publicKey != nil) {
          let publicKeyData = SecKeyCopyExternalRepresentation(publicKey!,nil)
          let finalPublicKeyData = publicKeyData! as Data;
          resolve(finalPublicKeyData.base64EncodedString());
        }
        else {
          resolve(nil);
        }
    }

    func encryptString(_ publicKey: SecKey, _ stringToEncrypt : String) -> String {
        let algorithm: SecKeyAlgorithm = .rsaEncryptionOAEPSHA256
        guard let base64Data = stringToEncrypt.data(using : .utf8) else {
            NSLog("Error converting string to base64")
            return ""
        }

        guard SecKeyIsAlgorithmSupported(publicKey, .encrypt, algorithm) else {
            NSLog("Encryption error, key algorithm is not supported")
            return ""
        }
        guard (base64Data.count < (SecKeyGetBlockSize(publicKey) - 130)) else {
            NSLog("String is too long to be encrypted with key")
            return ""
        }
        var error : Unmanaged<CFError>?
        guard let cipherData = SecKeyCreateEncryptedData(publicKey,algorithm,base64Data as CFData, &error) as Data? else {
            NSLog("Error encrypting string")
            return ""
        }
        let cipherString = cipherData.base64EncodedString()
        return cipherString;
    }

    @objc
    func encryptStrings(_ keyOrAlias : String,
    loadKeyFromKeystore : Bool,
    algorithm : String,
    blockmode : String,
    padding : String,
    strings : [String],
    resolve : RCTPromiseResolveBlock,
    reject : RCTPromiseRejectBlock) {
        var results = [String]();
        var publicKey : SecKey? = nil;
        if(loadKeyFromKeystore) {
          publicKey = loadRSAPublicKey(keyOrAlias)
        }
        else {
          guard let keyAsData = Data(base64Encoded : keyOrAlias) else {
              NSLog("Error converting key to data")
              return resolve("base64 error");
          }
          
          var attributes = commonKeyAttributes
          attributes[kSecAttrKeyClass as String] = kSecAttrKeyClassPublic

          var error : Unmanaged<CFError>?
          publicKey = SecKeyCreateWithData(keyAsData as CFData, attributes as CFDictionary,&error);
        }
        for string in strings {
            results.append(encryptString(publicKey!, string))
        }
        resolve(results);
    }

    func decryptString(_ privateKey: SecKey, _ stringToDecrypt : String) -> String {
        let algorithm: SecKeyAlgorithm = .rsaEncryptionOAEPSHA256
        guard let base64Data = Data(base64Encoded : stringToDecrypt) else {
            NSLog("Error converting string to base64")
            return ""
        }
        guard SecKeyIsAlgorithmSupported(privateKey, .decrypt, algorithm) else {
            NSLog("Decryption error error, key algorithm is not supported")
            return ""
        }
        guard (base64Data.count == SecKeyGetBlockSize(privateKey)) else {
            NSLog("String is wrong size to be decrypted with key")
            return ""
        }
        var error : Unmanaged<CFError>?
        guard let plainTextData = SecKeyCreateDecryptedData(privateKey,algorithm,base64Data as CFData, &error) as Data? else {
            NSLog("Error decrypting string")
            return ""
        }
        let plainTextString = String(decoding: plainTextData, as: UTF8.self)
        return plainTextString;
    }

    @objc
    func decryptStrings(_ alias : String,
    algorithm : String,
    blockmode : String,
    padding : String,
    strings : [String],
    resolve : RCTPromiseResolveBlock,
    reject : RCTPromiseRejectBlock) {
        let privateKey = loadRSAPrivateKey(alias);
        var results = [String]();
        if(privateKey == nil) {
            reject("KEY_ERROR","error loading private key from keystore",NSError());
        }
        for string in strings {
            results.append(decryptString(privateKey!,string))
        }
        resolve(results);
    }

    @objc
    func decryptStringsWithIdentifier(_ alias : String,
    algorithm : String,
    blockmode : String,
    padding : String,
    strings : [NSDictionary],
    resolve : RCTPromiseResolveBlock,
    reject : RCTPromiseRejectBlock) {
        let privateKey = loadRSAPrivateKey(alias);
        var results = [[String : String]]()
        if(privateKey == nil) {
            reject("KEY_ERROR","error loading private key from keystore",NSError());
        }
        //need to guard against mismatched object structure in future, i.e 'text' or 'identifier' are null
        //currently force unwrapping nullable strings into non-nullable strings, could crash app
        for object in strings {
            let text = object.value(forKey: "text") as? String;
            let identifier = object.value(forKey : "identifier") as? String;
            let decrypted = decryptString(privateKey!, text!);
            results.append([
                "text" : decrypted,
                "identifier" : identifier!
            ])
        }
        resolve(results);
    }

    @objc
    func cancelCoroutineWork(_ resolve : RCTPromiseResolveBlock,
    reject : RCTPromiseRejectBlock) {
        resolve(true);
    }

    @objc
    func createHash(_ value : String,
    resolve : RCTPromiseResolveBlock,
    reject : RCTPromiseRejectBlock) {
      
      guard let stringData : Data = value.data(using: .utf8) else {
        NSLog("Error converting string to data")
        return resolve("string conversion error");
      }
      
      let digest = SHA512.hash(data: stringData);
      
      let hashString = digest
      .compactMap{String(format: "%02x",$0)}
      .joined()
      
      resolve(hashString);
    }
    
    @objc
    func compareHashes(_ firstHash : String,
    secondHash : String,
    resolve : RCTPromiseResolveBlock,
    reject : RCTPromiseRejectBlock) {
        let firstHashBytes = firstHash.data(using: .utf8);
        let secondHashBytes = secondHash.data(using: .utf8);
        resolve(firstHashBytes == secondHashBytes);
    }
}
