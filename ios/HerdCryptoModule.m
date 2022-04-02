#import <Foundation/Foundation.h>

#import "HerdCryptoModule.h"

@implementation HerdCryptoModule

RCT_EXPORT_METHOD(generateRSAKeyPair : (NSString*) alias
resolver : (RCTPromiseResolveBlock)resolve
rejecter : (RCTPromiseRejectBlock)reject) {
  resolve(nil);
}
RCT_EXPORT_METHOD(deleteKeyPair : (NSString*) alias
resolver : (RCTPromiseResolveBlock)resolve
rejecter : (RCTPromiseRejectBlock)reject) {
  resolve(nil);
}
RCT_EXPORT_METHOD(loadKeyFromKeystore : (NSString*) alias
resolver : (RCTPromiseResolveBlock)resolve
rejecter : (RCTPromiseRejectBlock)reject) {
  resolve(@"");
}
RCT_EXPORT_METHOD(encryptString : (NSString*) alias
algo : (NSString*) algorithm
bMode : (NSString*) blockmode
pad : (NSString*) padding
toEncrypt : (NSString*) stringToEncrypt
resolver : (RCTPromiseResolveBlock)resolve
rejecter : (RCTPromiseRejectBlock)reject) {
  resolve(@"");
}
RCT_EXPORT_METHOD(encryptStringWithKey : (NSString*) key
algo : (NSString*) algorithm
bMode : (NSString*) blockmode
pad : (NSString*) padding
toEncrypt : (NSString*) stringToEncrypt
resolver : (RCTPromiseResolveBlock)resolve
rejecter : (RCTPromiseRejectBlock)reject) {
  resolve(@"");
}
RCT_EXPORT_METHOD(decryptString : (NSString*) alias
algo : (NSString*) algorithm
bMode : (NSString*) blockmode
pad : (NSString*) padding
toDecrypt : (NSString*) stringToDecrypt
resolver : (RCTPromiseResolveBlock)resolve
rejecter : (RCTPromiseRejectBlock)reject) {
  resolve(@"");
}

RCT_EXPORT_MODULE(CryptoModule);

@end
