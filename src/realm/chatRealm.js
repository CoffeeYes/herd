import Realm from 'realm';
import Schemas from '../Schemas';
import Crypto from '../nativeWrapper/Crypto';
import { getContactsByKey } from './contactRealm'

const messageCopyRealm = new Realm({
  path : "MessagesCopy",
  schema: [Schemas.MessageSchema],
});

const messageReceivedRealm = new Realm({
  path : "MessagesReceived",
  schema: [Schemas.MessageSchema],
});

const messageSentRealm = new Realm({
  path : "MessagesSent",
  schema : [Schemas.MessageSchema]
})

const getMessagesWithContact = async key => {
  const sentMessagesCopy = messageCopyRealm.objects("Message")?.filtered("to = " + "'" + key + "'");
  const receivedMessages = messageReceivedRealm.objects("Message")?.filtered("from = " + "'" + key + "'");

  var initialReceivedMessages = [];
  if(receivedMessages.length > 0) {
    for(var message in receivedMessages) {
      const decrypted = await Crypto.decryptString(
        "herdPersonal",
        Crypto.algorithm.RSA,
        Crypto.blockMode.ECB,
        Crypto.padding.OAEP_SHA256_MGF1Padding,
        receivedMessages[message].text
      )
      initialReceivedMessages.push({...receivedMessages[message],text : decrypted});
    }
  }

  var initialSentMessages = [];
  if(sentMessagesCopy.length > 0) {
    for(var message in sentMessagesCopy) {
      const decrypted = await Crypto.decryptString(
        "herdPersonal",
        Crypto.algorithm.RSA,
        Crypto.blockMode.ECB,
        Crypto.padding.OAEP_SHA256_MGF1Padding,
        sentMessagesCopy[message].text
      )
      initialSentMessages.push({...sentMessagesCopy[message],text : decrypted})
    }
  }

  return [...initialSentMessages,...initialReceivedMessages].sort( (a,b) => a.timestamp > b.timestamp)
}

const sendMessageToContact = (metaData, encrypted, selfEncryptedCopy) => {

  messageCopyRealm.write(() => {
    messageCopyRealm.create("Message",{
      ...metaData,
      _id : Realm.BSON.ObjectId(),
      text : selfEncryptedCopy,
    })
  });

  messageSentRealm.write(() => {
    messageSentRealm.create("Message",{
      ...metaData,
      _id : Realm.BSON.ObjectId(),
      text : encrypted,
    })
  });
}

const getContactsWithChats = () => {
  const sentMessages = messageCopyRealm.objects('Message');
  const receivedMessages = messageReceivedRealm.objects('Message');
  var keys = [];

  sentMessages.map(message => keys.indexOf(message.to) === -1 && keys.push(message.to));
  receivedMessages.map(message => keys.indexOf(message.from) === -1 && keys.push(message.from));
  if(keys.length > 0) {
    return getContactsByKey(keys);
  }
  else {
    return []
  }
}

const deleteChat = key => {
  const sentMessagesToDelete = messageSentRealm.objects('Message').filtered("to = " + "'" + key + "'");
  const sentMessagesToDeleteCopy = messageCopyRealm.objects('Message').filtered("to = " + "'" + key + "'");
  const receivedMessagesToDelete = messageReceivedRealm.objects('Message').filtered("from = " + "'" + key + "'");

  messageSentRealm.write(() => {
    sentMessagesToDelete.map(message => messageSentRealm.delete(message))
  })
  messageCopyRealm.write(() => {
    sentMessagesToDeleteCopy.map(message => messageCopyRealm.delete(message))
  })
  messageReceivedRealm.write(() => {
    receivedMessagesToDelete.map(message => messageReceivedRealm.delete(message))
  })
}

const deleteAllChats = () => {
  messageSentRealm.write(() => {
    messageSentRealm.deleteAll();
  })
  messageCopyRealm.write(() => {
    messageCopyRealm.deleteAll();
  })
  messageReceivedRealm.write(() => {
    messageReceivedRealm.deleteAll();
  })
}

const closeChatRealm = () => {
  messageCopyRealm.close();
  messageReceivedRealm.close();
  messageSentRealm.close();
}

export {
  getMessagesWithContact,
  sendMessageToContact,
  getContactsWithChats,
  deleteChat,
  deleteAllChats,
  closeChatRealm,
}
