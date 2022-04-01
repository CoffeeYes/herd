#import <Foundation/Foundation.h>

#import "HerdServiceInterfaceModule.h"
#import <React/RCTLog.h>

@implementation HerdServiceInterfaceModule

RCT_EXPORT_METHOD(isRunning : (RCTPromiseResolveBlock) resolve
rejecter: (RCTPromiseRejectBlock) reject {
  resolve(false);
})

RCT_EXPORT_MODULE(ServiceInterfaceModule);

@end
