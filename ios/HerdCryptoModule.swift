import Foundation

@objc(HerdCryptoModule)
class HerdCryptoModule : NSObject {
    @objc
    func constantsToExport() -> [String : [String : String]]! {
        let constants : [String : [String : String]] = [
            "algorithm" : [
                "RSA" : "RSA",
                "AES" : "AES",
                "AES_128" : "AES_128",
                "AES_256" : "AES_256",
                "ARC4" : "ARC4",
                "BLOWFISH" : "BLOWFISH",
                "ChaCha20" : "ChaCha20",
                "DES" : "DES",
                "DESede" : "DESede"
            ],
            "blockMode" : [
                "CBC" : "CBC",
                "CFB" : "CFB",
                "CTR" : "CTR",
                "CTS" : "CTS",
                "ECB" : "ECB",
                "OFB" : "OFB",
                "GCM" : "GCM",
                "Poly1305" : "Poly1305",
                "NONE" : "NONE"
            ],
            "padding" : [
                "NO_PADDING" : "NoPadding",
                "ISO10126Padding" : "ISO10126Padding",
                "PKCS5Padding" : "PKCS5Padding",
                "OAEPPadding" : "OAEPPadding",
                "OAEP_SHA1_MGF1Padding" : "OAEPwithSHA-1andMGF1Padding",
                "OAEP_SHA256_MGF1Padding" : "OAEPwithSHA-256andMGF1Padding",
                "OAEP_SHA224_MGF1Padding" : "OAEPwithSHA-224andMGF1Padding",
                "OAEP_SHA384_MGF1Padding" : "OAEPwithSHA-384andMGF1Padding",
                "OAEP_SHA512_MGF1Padding" : "OAEPwithSHA-512andMGF1Padding"
            ]
        ]
        return constants;
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
  
    func loadRSAPublicKey(_ alias : String) -> SecKey? {
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
      let publicKey = SecKeyCopyPublicKey(privateKey);
      return publicKey;
    }

    @objc
    func loadKeyFromKeystore(_ alias : String, resolve : RCTPromiseResolveBlock, reject : RCTPromiseRejectBlock) {
        let publicKey = loadRSAPublicKey(alias);
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
        let publicKey: SecKey? = loadRSAPublicKey(alias);
        let algorithm: SecKeyAlgorithm = .rsaEncryptionOAEPSHA256
        guard let base64Data = Data(base64Encoded : stringToEncrypt) else {
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
        guard (stringToEncrypt.count < (SecKeyGetBlockSize(publicKey!) - 130)) else {
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
