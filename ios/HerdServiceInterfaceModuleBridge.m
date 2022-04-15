#import <Foundation/Foundation.h>
#import "React/RCTBridgeModule.h"

@interface RCT_EXTERN_REMAP_MODULE(ServiceInterfaceModule,HerdServiceInterfaceModule,NSObject)

RCT_EXTERN_METHOD(isRunning : (RCTPromiseResolveBlock) resolve
reject: (RCTPromiseRejectBlock) reject)

RCT_EXTERN_METHOD(enableService : (NSArray*)messageQueue
receivedMessagesForSelf : (NSArray*) receivedMessagesForSelf
deletedReceivedMessages : (NSArray*) deletedReceivedMessages
publicKey : (NSString*) publicKey)

RCT_EXTERN_METHOD(addMessageToService : (NSDictionary*) message
resolve : (RCTPromiseResolveBlock) resolve
reject : (RCTPromiseRejectBlock) reject)

RCT_EXTERN_METHOD(removeMessagesFromService : (NSArray*) messages
resolve : (RCTPromiseResolveBlock) resolve
reject : (RCTPromiseRejectBlock) reject)

RCT_EXTERN_METHOD(addDeletedMessagesToService : (NSArray*) messages
resolve : (RCTPromiseResolveBlock) resolve
reject : (RCTPromiseRejectBlock) reject)

RCT_EXTERN_METHOD(getReceivedMessages : (RCTPromiseResolveBlock) resolve
reject : (RCTPromiseRejectBlock) reject)

RCT_EXTERN_METHOD(getCompletedMessages : (RCTPromiseResolveBlock) resolve
reject : (RCTPromiseRejectBlock) reject)

RCT_EXTERN_METHOD(getStoredMessages : (NSString*) filename
sizesFilename : (NSString*) sizesFilename
resolve : (RCTPromiseResolveBlock) resolve
reject : (RCTPromiseRejectBlock) reject)

RCT_EXTERN_METHOD(disableService)

@end
