#import <Foundation/Foundation.h>
#import "React/RCTBridgeModule.h"

@interface RCT_EXTERN_REMAP_MODULE(BluetoothModule,HerdBluetoothModule,NSObject)

RCT_EXTERN_METHOD(scanForDevices : (RCTPromiseResolveBlock) resolve
reject:(RCTPromiseRejectBlock) reject)

RCT_EXTERN_METHOD(cancelScanForDevices : (RCTPromiseResolveBlock) resolve
reject:(RCTPromiseRejectBlock) reject)

RCT_EXTERN_METHOD(checkBTEnabled : (RCTPromiseResolveBlock) resolve
reject:(RCTPromiseRejectBlock) reject)

RCT_EXTERN_METHOD(checkForBTAdapter : (RCTPromiseResolveBlock) resolve
reject:(RCTPromiseRejectBlock) reject)

RCT_EXTERN_METHOD(requestBTEnable : (RCTPromiseResolveBlock) resolve
reject:(RCTPromiseRejectBlock) reject)

RCT_EXTERN_METHOD(requestBTMakeDiscoverable : (int) duration
resolve: (RCTPromiseResolveBlock) resolve
reject: (RCTPromiseRejectBlock) reject)

RCT_EXTERN_METHOD(checkLocationEnabled : (RCTPromiseResolveBlock) resolve
reject:(RCTPromiseRejectBlock) reject)

RCT_EXTERN_METHOD(requestLocationEnable : (RCTPromiseResolveBlock) resolve
reject:(RCTPromiseRejectBlock) reject)

RCT_EXTERN_METHOD(writeToBTConnection : (NSString*) value
resolve:(RCTPromiseResolveBlock) resolve
reject:(RCTPromiseRejectBlock) reject)

RCT_EXTERN_METHOD(cancelBTConnectionThread)

RCT_EXTERN_METHOD(listenAsServer : (RCTPromiseResolveBlock) resolve
reject:(RCTPromiseRejectBlock) reject)

RCT_EXTERN_METHOD(cancelListenAsServer : (RCTPromiseResolveBlock) resolve
reject:(RCTPromiseRejectBlock) reject)

RCT_EXTERN_METHOD(connectAsClient : (RCTPromiseResolveBlock) resolve
reject:(RCTPromiseRejectBlock) reject)

RCT_EXTERN_METHOD(cancelConnectAsClient : (RCTPromiseResolveBlock) resolve
reject:(RCTPromiseRejectBlock) reject)

@end
