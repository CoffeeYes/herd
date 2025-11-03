#import <Foundation/Foundation.h>
#import "React/RCTBridgeModule.h"

@interface RCT_EXTERN_REMAP_MODULE(BluetoothModule,HerdBluetoothModule,NSObject)

RCT_EXTERN_METHOD(scanForDevices : (RCTPromiseResolveBlock) resolve
reject:(RCTPromiseRejectBlock) reject)

RCT_EXTERN_METHOD(scanForBLEDevices : (NSString*) publicKey
scanDuration: (Int) scanDuration
resolve:(RCTPromiseResolveBlock) resolve
reject:(RCTPromiseRejectBlock) reject)

RCT_EXTERN_METHOD(cancelScanForBLEDevices : (RCTPromiseResolveBlock) resolve
reject:(RCTPromiseRejectBlock) reject)

RCT_EXTERN_METHOD(connectToBLEPeripheral: (NSString*) peripheralIdentifier
resolve:(RCTPromiseResolveBlock) resolve
reject:(RCTPromiseRejectBlock) reject)

RCT_EXTERN_METHOD(disconnectFromBLEPeripheral: (NSString*) peripheralIdentifier
resolve:(RCTPromiseResolveBlock) resolve
reject:(RCTPromiseRejectBlock) reject)

RCT_EXTERN_METHOD(checkBTEnabled : (RCTPromiseResolveBlock) resolve
reject:(RCTPromiseRejectBlock) reject)

RCT_EXTERN_METHOD(checkForBTAdapter : (RCTPromiseResolveBlock) resolve
reject:(RCTPromiseRejectBlock) reject)

RCT_EXTERN_METHOD(requestBTEnable : (RCTPromiseResolveBlock) resolve
reject:(RCTPromiseRejectBlock) reject)

RCT_EXTERN_METHOD(checkLocationEnabled : (RCTPromiseResolveBlock) resolve
reject:(RCTPromiseRejectBlock) reject)

RCT_EXTERN_METHOD(requestLocationEnable : (RCTPromiseResolveBlock) resolve
reject:(RCTPromiseRejectBlock) reject)

@end
