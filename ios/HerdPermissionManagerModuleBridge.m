#import <Foundation/Foundation.h>

#import "React/RCTBridgeModule.h"

@interface RCT_EXTERN_REMAP_MODULE(PermissionManagerModule,HerdPermissionManagerModule,NSObject)

RCT_EXTERN_METHOD(checkBTPermissions : (RCTPromiseResolveBlock) resolve
reject:(RCTPromiseRejectBlock) reject)

RCT_EXTERN_METHOD(requestBTPermissions : (RCTPromiseResolveBlock) resolve
reject:(RCTPromiseRejectBlock) reject)

RCT_EXTERN_METHOD(checkLocationPermission : (RCTPromiseResolveBlock) resolve
reject:(RCTPromiseRejectBlock) reject)

RCT_EXTERN_METHOD(requestLocationPermissions : (RCTPromiseResolveBlock) resolve
reject:(RCTPromiseRejectBlock) reject)

RCT_EXTERN_METHOD(requestNotificationPermissions: (RCTPromiseResolveBlock) resolve
reject:(RCTPromiseRejectBlock) reject)

RCT_EXTERN_METHOD(navigateToSettings: (RCTPromiseResolveBlock) resolve
reject:(RCTPromiseRejectBlock) reject)

@end
