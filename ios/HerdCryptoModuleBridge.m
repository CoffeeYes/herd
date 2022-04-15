#import <Foundation/Foundation.h>

#import "React/RCTBridgeModule.h"

@interface RCT_EXTERN_REMAP_MODULE(CryptoModule,HerdCryptoModule,NSObject)

RCT_EXTERN_METHOD(generateRSAKeyPair : (NSString*) alias
resolve : (RCTPromiseResolveBlock)resolve
reject : (RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(deleteKeyPair : (NSString*) alias
resolve : (RCTPromiseResolveBlock)resolve
reject : (RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(loadKeyFromKeystore : (NSString*) alias
resolve : (RCTPromiseResolveBlock)resolve
reject : (RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(encryptString : (NSString*) alias
algo : (NSString*) algorithm
bMode : (NSString*) blockmode
pad : (NSString*) padding
toEncrypt : (NSString*) stringToEncrypt
resolve : (RCTPromiseResolveBlock)resolve
reject : (RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(encryptStringWithKey : (NSString*) key
algo : (NSString*) algorithm
bMode : (NSString*) blockmode
pad : (NSString*) padding
toEncrypt : (NSString*) stringToEncrypt
resolve : (RCTPromiseResolveBlock)resolve
reject : (RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(decryptString : (NSString*) alias
algo : (NSString*) algorithm
bMode : (NSString*) blockmode
pad : (NSString*) padding
toDecrypt : (NSString*) stringToDecrypt
resolve : (RCTPromiseResolveBlock)resolve
reject : (RCTPromiseRejectBlock)reject)

@end
