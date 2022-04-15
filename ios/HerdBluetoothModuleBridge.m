#import <Foundation/Foundation.h>
#import "React/RCTBridgeModule.h"

@interface RCT_EXTERN_REMAP_MODULE(BluetoothModule,HerdBluetoothModule,NSObject)

RCT_EXTERN_METHOD(scanForDevices : (RCTPromiseResolveBlock) resolve
rejecter:(RCTPromiseRejectBlock) reject)

RCT_EXTERN_METHOD(cancelScanForDevices : (RCTPromiseResolveBlock) resolve
rejecter:(RCTPromiseRejectBlock) reject)

RCT_EXTERN_METHOD(checkBTEnabled : (RCTPromiseResolveBlock) resolve
rejecter:(RCTPromiseRejectBlock) reject)

RCT_EXTERN_METHOD(checkForBTAdapter : (RCTPromiseResolveBlock) resolve
rejecter:(RCTPromiseRejectBlock) reject)

RCT_EXTERN_METHOD(requestBTEnable : (RCTPromiseResolveBlock) resolve
rejecter:(RCTPromiseRejectBlock) reject)

RCT_EXTERN_METHOD(requestBTMakeDiscoverable : (int) duration
resolver: (RCTPromiseResolveBlock) resolve
rejecter: (RCTPromiseRejectBlock) reject)

RCT_EXTERN_METHOD(checkLocationPermission : (RCTPromiseResolveBlock) resolve
rejecter:(RCTPromiseRejectBlock) reject)

RCT_EXTERN_METHOD(requestLocationPermissions : (RCTPromiseResolveBlock) resolve
rejecter:(RCTPromiseRejectBlock) reject)

RCT_EXTERN_METHOD(checkLocationEnabled : (RCTPromiseResolveBlock) resolve
rejecter:(RCTPromiseRejectBlock) reject)

RCT_EXTERN_METHOD(requestLocationEnable : (RCTPromiseResolveBlock) resolve
rejecter:(RCTPromiseRejectBlock) reject)

RCT_EXTERN_METHOD(writeToBTConnection : (NSString*) value
resolver:(RCTPromiseResolveBlock) resolve
rejecter:(RCTPromiseRejectBlock) reject)

RCT_EXTERN_METHOD(cancelBTConnectionThread)

RCT_EXTERN_METHOD(listenAsServer : (RCTPromiseResolveBlock) resolve
rejecter:(RCTPromiseRejectBlock) reject)

RCT_EXTERN_METHOD(cancelListenAsServer : (RCTPromiseResolveBlock) resolve
rejecter:(RCTPromiseRejectBlock) reject)

RCT_EXTERN_METHOD(connectAsClient : (RCTPromiseResolveBlock) resolve
rejecter:(RCTPromiseRejectBlock) reject)

RCT_EXTERN_METHOD(cancelConnectAsClient : (RCTPromiseResolveBlock) resolve
rejecter:(RCTPromiseRejectBlock) reject)

@end
