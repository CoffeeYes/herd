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
algorithm : (NSString*) algorithm
blockmode : (NSString*) blockmode
padding : (NSString*) padding
stringToEncrypt : (NSString*) stringToEncrypt
resolve : (RCTPromiseResolveBlock)resolve
reject : (RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(encryptStringWithKey : (NSString*) key
algorithm : (NSString*) algorithm
blockmode : (NSString*) blockmode
padding : (NSString*) padding
stringToEncrypt : (NSString*) stringToEncrypt
resolve : (RCTPromiseResolveBlock)resolve
reject : (RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(decryptString : (NSString*) alias
algorithm : (NSString*) algorithm
blockmode : (NSString*) blockmode
padding : (NSString*) padding
stringToDecrypt : (NSString*) stringToDecrypt
resolve : (RCTPromiseResolveBlock)resolve
reject : (RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(
	encryptStrings : (NSString*) keyOrAlias
	loadKeyFromKeystore : (BOOL) loadKeyFromKeystore
	algorithm : (NSString*) algorithm
	blockmode : (NSString*) blockmode
	padding : (NSString*) padding
	strings : (NSArray) strings
	resolve : (RCTPromiseResolveBlock)resolve
	reject : (RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
	decryptStrings : (NSString*) alias 
	algorithm : (NSString*) algorithm
	blockmode : (NSString*) blockmode
	padding : (NSString*) padding
	strings : (NSArray) strings
	resolve : (RCTPromiseResolveBlock)resolve
	reject : (RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
	decryptStringsWithIdentifier : (NSString*) alias
  algorithm : (NSString*) algorithm
  blockmode : (NSString*) blockmode
  padding : (NSString*) padding
  strings : (NSArray) strings
  resolve : (RCTPromiseResolveBlock) resolve
	reject : (RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
	cancelCoroutineWork : (RCTPromiseResolveBlock) resolve
	reject : (RCTPromiseRejectBlock) reject
)

RCT_EXTERN_METHOD(createHash : (NSString*) value
resolve : (RCTPromiseResolveBlock)resolve
reject : (RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(compareHashes : (NSString*) firstHash
secondHash : (NSString*) secondHash
resolve : (RCTPromiseResolveBlock)resolve
reject : (RCTPromiseRejectBlock)reject)

@end
