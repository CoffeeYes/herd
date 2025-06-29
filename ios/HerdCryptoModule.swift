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

    func loadRSAPrivateKey(_ alias : String) -> SecKey? {
        let getquery: [String: Any] = [
          kSecClass as String: kSecClassKey,
          kSecAttrApplicationTag as String: alias,
          kSecAttrKeyType as String: kSecAttrKeyTypeRSA,
          kSecReturnRef as String: true
      ]
      var storedKey: CFTypeRef?
      let status = SecItemCopyMatching(getquery as CFDictionary, &storedKey)
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
            let publicKey = SecKeyCopyPublicKey(privateKey as! SecKey);
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

    @objc
    func encryptString(_ alias : String,
    algorithm : String,
    blockmode : String,
    padding : String,
    stringToEncrypt : String,
    resolve : RCTPromiseResolveBlock,
    reject : RCTPromiseRejectBlock) {
        let publicKey: SecKey? = loadRSAPublicKey(alias);
        let algorithm: SecKeyAlgorithm = .rsaEncryptionOAEPSHA256
        guard let base64Data = stringToEncrypt.data(using : .utf8) else {
            NSLog("Error converting string to base64")
            return resolve("base64 error");
        }

        if(publicKey == nil) {
            return resolve(nil);
        }

        guard SecKeyIsAlgorithmSupported(publicKey!, .encrypt, algorithm) else {
            NSLog("Encryption error, key algorithm is not supported")
            return resolve(nil);
        }
        guard (base64Data.count < (SecKeyGetBlockSize(publicKey!) - 130)) else {
            NSLog("String is too long to be encrypted with key")
            return resolve(nil);
        }
        var error : Unmanaged<CFError>?
        guard let cipherData = SecKeyCreateEncryptedData(publicKey!,algorithm,base64Data as CFData, &error) as Data? else {
            NSLog("Error encrypting string")
            return resolve(nil);
        }
        let cipherString = cipherData.base64EncodedString()
        resolve(cipherString);
    }

    @objc
    func decryptString(_ alias : String,
    algorithm : String,
    blockmode : String,
    padding : String,
    stringToDecrypt : String,
    resolve : RCTPromiseResolveBlock,
    reject : RCTPromiseRejectBlock) {
        let privateKey = loadRSAPrivateKey(alias);
        let algorithm: SecKeyAlgorithm = .rsaEncryptionOAEPSHA256
        if(privateKey != nil) {
            guard let base64Data = Data(base64Encoded : stringToDecrypt) else {
                NSLog("Error converting string to base64")
                return resolve(nil);
            }
            guard SecKeyIsAlgorithmSupported(privateKey!, .decrypt, algorithm) else {
                NSLog("Decryption error error, key algorithm is not supported")
                return resolve(nil);
            }
            guard (base64Data.count == SecKeyGetBlockSize(privateKey!)) else {
                NSLog("String is wrong size to be decrypted with key")
                return resolve(nil);
            }
            var error : Unmanaged<CFError>?
            guard let plainTextData = SecKeyCreateDecryptedData(privateKey!,algorithm,base64Data as CFData, &error) as Data? else {
                NSLog("Error decrypting string")
                return resolve(nil);
            }
            let plainTextString = String(decoding: plainTextData, as: UTF8.self)
            resolve(plainTextString);	
        }
        else {
            resolve("no private key");
        }
    }

    @objc
    func encryptStringWithKey(_ key : String,
    algorithm : String,
    blockmode : String,
    padding : String,
    stringToEncrypt : String,
    resolve : RCTPromiseResolveBlock,
    reject : RCTPromiseRejectBlock) {
      guard let keyAsData = Data(base64Encoded : key) else {
          NSLog("Error converting key to data")
          return resolve("base64 error");
      }

      let attributes : [String : Any] = [
              kSecAttrKeyType as String : kSecAttrKeyTypeRSA,
              kSecAttrKeySizeInBits as String : 2048,
              kSecAttrKeyClass as String : kSecAttrKeyClassPublic
      ]
      var error : Unmanaged<CFError>?
      guard let publicKey = SecKeyCreateWithData(keyAsData as CFData, attributes as CFDictionary,&error) else {
        NSLog("Error creating public key from string data");
        return resolve("Error converting string key to actual key")
      }

      guard let base64Data = stringToEncrypt.data(using : .utf8) else {
          NSLog("Error decoding base64 string")
          return resolve("base64 error");
      }
      let algorithm: SecKeyAlgorithm = .rsaEncryptionOAEPSHA256;
      guard let cipherData = SecKeyCreateEncryptedData(publicKey,algorithm,base64Data as CFData, &error) as Data? else {
        NSLog("Error encrypting string");
          return resolve(nil);
      }
      let cipherString = cipherData.base64EncodedString();
      resolve(cipherString);
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
          let attributes : [String : Any] = [
              kSecAttrKeyType as String : kSecAttrKeyTypeRSA,
              kSecAttrKeySizeInBits as String : 2048,
              kSecAttrKeyClass as String : kSecAttrKeyClassPublic
          ]
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
    strings : [NSObject],
    resolve : RCTPromiseResolveBlock,
    reject : RCTPromiseRejectBlock) {
        resolve(true);
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
      
      var hash = [UInt8](repeating: 0, count: Int(CC_SHA256_DIGEST_LENGTH));
      CC_SHA256((stringData as NSData).bytes,CC_LONG(stringData.count),&hash)
      
      var hashString = "";
      for byte in hash {
        hashString += String(format : "%02x", UInt8(byte))
      }
      
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
