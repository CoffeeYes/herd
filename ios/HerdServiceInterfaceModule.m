#import <Foundation/Foundation.h>

#import "HerdServiceInterfaceModule.h"
#import <React/RCTLog.h>

@implementation HerdServiceInterfaceModule

RCT_EXPORT_METHOD(isRunning : (RCTPromiseResolveBlock) resolve
rejecter: (RCTPromiseRejectBlock) reject {
  resolve(false);
})

RCT_EXPORT_METHOD(enableService : (NSArray*)messageQueue
receivedForSelf : (NSArray*) receivedMessagesForSelf
deletedReceived : (NSArray*) deletedReceivedMessages
publicKey : (NSString*) publicKey) {

}

RCT_EXPORT_METHOD(addMessageToService : (NSDictionary*) message
resolver : (RCTPromiseResolveBlock) resolve
rejecter : (RCTPromiseRejectBlock) reject) {
  resolve(false);
}
RCT_EXPORT_METHOD(removeMessagesFromService : (NSArray*) messages
resolver : (RCTPromiseResolveBlock) resolve
rejecter : (RCTPromiseRejectBlock) reject) {
  resolve(false);
}
RCT_EXPORT_METHOD(addDeletedMessagesToService : (NSArray*) messages
resolver : (RCTPromiseResolveBlock) resolve
rejecter : (RCTPromiseRejectBlock) reject) {
  resolve(false);
}
RCT_EXPORT_METHOD(getReceivedMessages : (RCTPromiseResolveBlock) resolve
rejecter : (RCTPromiseRejectBlock) reject) {
  NSArray* receivedMessages = @[];
  resolve(receivedMessages);
}
RCT_EXPORT_METHOD(getCompletedMessages : (RCTPromiseResolveBlock) resolve
rejecter : (RCTPromiseRejectBlock) reject) {
  NSArray* completedMessages = @[];
  resolve(completedMessages);
}
RCT_EXPORT_METHOD(getStoredMessages : (NSString*) filename
sizes : (NSString*) sizesFilename
resolver : (RCTPromiseResolveBlock) resolve
rejecter : (RCTPromiseRejectBlock) reject) {
  NSArray* completedMessages = @[];
  resolve(completedMessages);
}

RCT_EXPORT_METHOD(disableService) {
  
}

RCT_EXPORT_MODULE(ServiceInterfaceModule);

@end
