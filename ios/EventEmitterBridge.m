#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(EventEmitter,RCTEventEmitter)

RCT_EXTERN_METHOD(supportedEvents)

RCT_EXTERN_METHOD(addListener : (NSString*) eventName)

RCT_EXTERN_METHOD(removeListeners : (int) eventName)

@end
