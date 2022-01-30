import Realm from 'realm';
import Schemas from '../Schemas';
import Crypto from '../nativeWrapper/Crypto';
import { getContactsByKey } from './contactRealm';
import { cloneDeep } from 'lodash'

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

const getMessagesWithContact = async (key, startIndex, endIndex) => {
  const ownKey = await Crypto.loadKeyFromKeystore('herdPersonal');
  // const sentMessagesCopy = messageCopyRealm.objects("Message")?.filtered("to = " + "'" + key + "'").slice(startIndex,endIndex);
  const sentMessagesCopy = messageCopyRealm.objects("Message")?.filtered(`to = '${key}'`).slice(startIndex,endIndex);
  const receivedMessages = messageReceivedRealm.objects("Message")?.filtered(`from = '${key}' AND to = '${ownKey}'`).slice(startIndex,endIndex);

  var initialReceivedMessages = [];
  if(receivedMessages.length > 0) {
    for(var message in receivedMessages) {
      const currentMessage = JSON.parse(JSON.stringify(receivedMessages[message]))
      const decrypted = await Crypto.decryptString(
        "herdPersonal",
        Crypto.algorithm.RSA,
        Crypto.blockMode.ECB,
        Crypto.padding.OAEP_SHA256_MGF1Padding,
        receivedMessages[message].text
      )
      initialReceivedMessages.push({...currentMessage,text : decrypted});
    }
  }

  var initialSentMessages = [];
  if(sentMessagesCopy.length > 0) {
    for(var message in sentMessagesCopy) {
      const currentMessage = JSON.parse(JSON.stringify(sentMessagesCopy[message]))
      const decrypted = await Crypto.decryptString(
        "herdPersonal",
        Crypto.algorithm.RSA,
        Crypto.blockMode.ECB,
        Crypto.padding.OAEP_SHA256_MGF1Padding,
        sentMessagesCopy[message].text
      )
      initialSentMessages.push({...currentMessage,text : decrypted});
    }
  }
  return [...initialSentMessages,...initialReceivedMessages].sort( (a,b) => a.timestamp > b.timestamp)
}

const sendMessageToContact = (metaData, encrypted, selfEncryptedCopy) => {

  const messageID = Realm.BSON.ObjectId();

  messageCopyRealm.write(() => {
    messageCopyRealm.create("Message",{
      ...metaData,
      _id : messageID,
      text : selfEncryptedCopy,
    })
  });

  messageSentRealm.write(() => {
    messageSentRealm.create("Message",{
      ...metaData,
      _id : messageID,
      text : encrypted,
    })
  });

  return messageID.toString();
}

const addNewReceivedMessages = messages => {
  messageReceivedRealm.write(() => {
    messages.map(message => messageReceivedRealm.write("Message",message))
  })
}

const getContactsWithChats = async () => {
  //get all messages sent and received
  const sentMessages = messageCopyRealm.objects('Message');
  const receivedMessages = messageReceivedRealm.objects('Message');
  var keys = [];

  //get unique keys in all messages
  sentMessages.map(message => keys.indexOf(message.to) === -1 && keys.push(message.to));
  receivedMessages.map(message => keys.indexOf(message.from) === -1 && keys.push(message.from));
  if(keys.length > 0) {
    //get timestamp of last message for each key
    var lastMessages = [];
    for(var key in keys) {
      const currentKey = keys[key];
      const currentLastMessage = (await getMessagesWithContact(currentKey,-1))[0];
      currentLastMessage &&
      lastMessages.push({key : currentKey, message : currentLastMessage});
    }
    //create new contacts array with last message text and timestamp
    // because realm doesnt allow mutation in place
    var contacts = getContactsByKey(keys);
    var contactsWithTimestamps = [];
    contacts.map(contact => {
      let currentContact = JSON.parse(JSON.stringify(contact));
      const matchingMessage = lastMessages.find(message => message.key == contact.key)?.message
      currentContact.timestamp = matchingMessage?.timestamp;
      currentContact.lastText = matchingMessage?.text;
      contactsWithTimestamps.push(currentContact);
    })
    return contactsWithTimestamps;
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
    messageSentRealm.delete(sentMessagesToDelete)
  })
  messageCopyRealm.write(() => {
    messageCopyRealm.delete(sentMessagesToDeleteCopy)
  })
  messageReceivedRealm.write(() => {
    messageReceivedRealm.delete(receivedMessagesToDelete)
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

const deleteMessages = messages => {
  const messageCopiesToDelete = messages.map(id => messageCopyRealm.objectForPrimaryKey('Message',Realm.BSON.ObjectId(id)));
  messageCopyRealm.write(() => {
    messageCopyRealm.delete(messageCopiesToDelete)
  })
  const messagesToDelete = messages.map(id => messageSentRealm.objectForPrimaryKey('Message',Realm.BSON.ObjectId(id)));
  messageSentRealm.write(() => {
    messageSentRealm.delete(messagesToDelete)
  })
}

//useMessageCopies determines wether to include self-encrypted copies of sent messages
//for the purpose of displaying them to the user
//when passing messageQueue to the background service these messages are not desired
const getMessageQueue = async useMessageCopies => {
  let sentMessages;
  let key = await Crypto.loadKeyFromKeystore("herdPersonal")
  if(useMessageCopies) {
    sentMessages = messageCopyRealm.objects('Message')
  }
  else {
    sentMessages = messageSentRealm.objects('Message').filtered("to != " + "'" + key + "'")
  }
  const receivedMessages= messageReceivedRealm.objects('Message').filtered("to != " + "'" + key + "'")

  let sentMessagesCopy = [];
  let receivedMessagesCopy = [];

  sentMessages.map(message => sentMessagesCopy.push({...JSON.parse(JSON.stringify(message))}));
  receivedMessages.map(message => receivedMessageCopy.push({...JSON.parse(JSON.stringify(message))}));

  return [...sentMessagesCopy,...receivedMessagesCopy]
}

const closeChatRealm = () => {
  messageCopyRealm.close();
  messageReceivedRealm.close();
  messageSentRealm.close();
}

export {
  getMessagesWithContact,
  sendMessageToContact,
  addNewReceivedMessages,
  getContactsWithChats,
  deleteChat,
  deleteAllChats,
  deleteMessages,
  getMessageQueue,
  closeChatRealm,
}
