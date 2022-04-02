#import <Foundation/Foundation.h>

#import "HerdBluetoothModule.h"

@implementation HerdBluetoothModule

RCT_EXPORT_METHOD(scanForDevices : (RCTPromiseResolveBlock) resolve
rejecter:(RCTPromiseRejectBlock) reject) {
  resolve(false);
}
RCT_EXPORT_METHOD(cancelScanForDevices : (RCTPromiseResolveBlock) resolve
rejecter:(RCTPromiseRejectBlock) reject) {
  resolve(false);
}
RCT_EXPORT_METHOD(checkBTEnabled : (RCTPromiseResolveBlock) resolve
rejecter:(RCTPromiseRejectBlock) reject) {
  resolve(false);
}
RCT_EXPORT_METHOD(checkForBTAdapter : (RCTPromiseResolveBlock) resolve
rejecter:(RCTPromiseRejectBlock) reject) {
  resolve(false);
}
RCT_EXPORT_METHOD(requestBTEnable : (RCTPromiseResolveBlock) resolve
rejecter:(RCTPromiseRejectBlock) reject) {
  resolve(false);
}
RCT_EXPORT_METHOD(requestBTMakeDiscoverable : (int) duration
resolver: (RCTPromiseResolveBlock) resolve
rejecter: (RCTPromiseRejectBlock) reject) {
  resolve(false);
}
RCT_EXPORT_METHOD(checkLocationPermission : (RCTPromiseResolveBlock) resolve
rejecter:(RCTPromiseRejectBlock) reject) {
  resolve(false);
}
RCT_EXPORT_METHOD(requestLocationPermissions : (RCTPromiseResolveBlock) resolve
rejecter:(RCTPromiseRejectBlock) reject) {
  resolve(false);
}
RCT_EXPORT_METHOD(checkLocationEnabled : (RCTPromiseResolveBlock) resolve
rejecter:(RCTPromiseRejectBlock) reject) {
  resolve(false);
}
RCT_EXPORT_METHOD(requestLocationEnable : (RCTPromiseResolveBlock) resolve
rejecter:(RCTPromiseRejectBlock) reject) {
  resolve(false);
}
RCT_EXPORT_METHOD(writeToBTConnection : (NSString*) value
resolver:(RCTPromiseResolveBlock) resolve
rejecter:(RCTPromiseRejectBlock) reject) {
  resolve(false);
}
RCT_EXPORT_METHOD(cancelBTConnectionThread) {

}
RCT_EXPORT_METHOD(listenAsServer : (RCTPromiseResolveBlock) resolve
rejecter:(RCTPromiseRejectBlock) reject) {
  resolve(false);
}
RCT_EXPORT_METHOD(cancelListenAsServer : (RCTPromiseResolveBlock) resolve
rejecter:(RCTPromiseRejectBlock) reject) {
  resolve(false);
}
RCT_EXPORT_METHOD(connectAsClient : (RCTPromiseResolveBlock) resolve
rejecter:(RCTPromiseRejectBlock) reject) {
  resolve(false);
}
RCT_EXPORT_METHOD(cancelConnectAsClient : (RCTPromiseResolveBlock) resolve
rejecter:(RCTPromiseRejectBlock) reject) {
  resolve(false);
}

RCT_EXPORT_MODULE(BluetoothModule);

@end
