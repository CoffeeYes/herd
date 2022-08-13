import Realm from 'realm';
import Schemas from './Schemas';
import Crypto from '../nativeWrapper/Crypto';
import ServiceInterface from '../nativeWrapper/ServiceInterface';
import { getContactsByKey, createContact } from './contactRealm';
import { parseRealmObject, parseRealmObjects} from './helper';
import { cloneDeep } from 'lodash';

import { addMessagesToQueue, addMessage, setChats } from '../redux/actions/chatActions';
import { addContact } from '../redux/actions/contactActions';

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

const deletedReceivedRealm = new Realm({
  path : "MessagesReceivedAndDeleted",
  schema : [Schemas.MessageSchema]
})

const getMessagesWithContact = async (key, startIndex, endIndex) => {
  const ownKey = await Crypto.loadKeyFromKeystore('herdPersonal');
  // const sentMessagesCopy = messageCopyRealm.objects("Message")?.filtered("to = " + "'" + key + "'").slice(startIndex,endIndex);
  const sentMessagesCopy = messageCopyRealm.objects("Message")?.filtered(`to = '${key}'`).slice(startIndex,endIndex);
  const receivedMessages = messageReceivedRealm.objects("Message")?.filtered(`from = '${key.trim()}' AND to = '${ownKey.trim()}'`).slice(startIndex,endIndex);
  // const receivedMessages = messageReceivedRealm.objects("Message").filter(message => message.from.trim() == key.trim() && message.to.trim() == ownKey.trim());
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

const addNewReceivedMessages = async (messages,dispatch) => {
  const receivedMessages = messageReceivedRealm.objects("Message");
  const deletedReceivedMessage = deletedReceivedRealm.objects("Message");
  const ownPublicKey = await Crypto.loadKeyFromKeystore('herdPersonal');
  const newMessages = messages.filter(nMessage =>
    receivedMessages.find(rMessage => rMessage._id === nMessage._id) === undefined &&
    deletedReceivedMessage.find(dMessage => dMessage._id === nMessage.id) === undefined
  );
  messageReceivedRealm.write(() => {
    newMessages.map(message => messageReceivedRealm.create("Message",{
      ...message,
      _id : Realm.BSON.ObjectId(message._id),
      from : message.from.trim(),
      to : message.to.trim()
    },true))
  })
  if(dispatch) {
    //add messages to queue
    dispatch(addMessagesToQueue(newMessages));
    //add new messages meant for this user to their corresponding chats
    const keys = newMessages.map(message => message.from.trim());
    const contacts = getContactsByKey(keys);
    newMessages.map(message => {
      let contact = contacts.find(contact => contact.key.trim() == message.from.trim());
      //if the message is for this user, but no contact exists create the contact
      if(contact === undefined && message.to.trim() == ownPublicKey.trim()) {
        contact = createContact({
          name : "Unknown User",
          key : message.from.trim(),
          image : ""
        });
        contacts.push(contact);
        dispatch(addContact(contact));
      }
      if(contact) {
        Crypto.decryptString(
          "herdPersonal",
          Crypto.algorithm.RSA,
          Crypto.blockMode.ECB,
          Crypto.padding.OAEP_SHA256_MGF1Padding,
          message.text
        ).then(decrypted => dispatch(addMessage(contact._id,{
          ...message,
          text : decrypted
        })))
      }
    })
    const chats = await getContactsWithChats();
    dispatch(setChats(chats))
  }
}

const getContactsWithChats = async () => {
  //get all messages sent and received
  const sentMessages = messageCopyRealm.objects('Message');
  const receivedMessages = messageReceivedRealm.objects('Message');
  var keys = [];
  //get unique keys in all messages
  sentMessages.map(message => keys.indexOf(message.to.trim()) === -1 && keys.push(message.to));
  receivedMessages.map(message => keys.indexOf(message.from.trim()) === -1 && keys.push(message.from));
  if(keys.length > 0) {
    //get timestamp of last message for each key
    var lastMessages = [];
    for(const key of keys) {
      const messages = (await getMessagesWithContact(key,-1));
      const currentLastMessage = messages.sort((a,b) => a.timestamp < b.timestamp)[0];
      currentLastMessage &&
      lastMessages.push({key : key, message : currentLastMessage});
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
      currentContact.lastMessageSentBySelf = matchingMessage?.from !== contact.key;
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

  ServiceInterface.removeMessagesFromService(parseRealmObjects(sentMessagesToDelete))

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

const deleteAllChats = async () => {
  const ownKey = await Crypto.loadKeyFromKeystore('herdPersonal')
  const receivedMessagesToDelete = messageReceivedRealm.objects('Message').filtered(`to = '${ownKey}'`);
  const sentMessages = messageSentRealm.objects('Message');

  ServiceInterface.removeMessagesFromService(parseRealmObjects(sentMessages))

  messageSentRealm.write(() => {
    messageSentRealm.deleteAll();
  })
  messageCopyRealm.write(() => {
    messageCopyRealm.deleteAll();
  })
  messageReceivedRealm.write(() => {
    messageReceivedRealm.delete(receivedMessagesToDelete);
  })
}

const deleteMessages = messages => {
  const sentMessageCopiesToDelete = messages.map(id =>
    messageCopyRealm.objectForPrimaryKey('Message',Realm.BSON.ObjectId(id))
  ).filter(message => message !== undefined);
  sentMessageCopiesToDelete.length > 0 &&
  messageCopyRealm.write(() => {
    messageCopyRealm.delete(sentMessageCopiesToDelete)
  })

  const sentMessagesToDelete = messages.map(id =>
    messageSentRealm.objectForPrimaryKey('Message',Realm.BSON.ObjectId(id))
  ).filter(message => message !== undefined);
  sentMessagesToDelete.length > 0 &&
  messageSentRealm.write(() => {
    messageSentRealm.delete(sentMessagesToDelete)
  })

  const receivedMessagesToDelete = messages.map(id =>
    messageReceivedRealm.objectForPrimaryKey('Message',Realm.BSON.ObjectId(id))
  ).filter(message => message !== undefined);

  //add deleted received messages to seperate realm to prevent them from being
  //re-added in the future
  deletedReceivedRealm.write(() => {
    receivedMessagesToDelete.map(message => deletedReceivedRealm.create('Message',message,true))
  })
  //remove deleted messages from received realm
  receivedMessagesToDelete.length > 0 &&
  messageReceivedRealm.write(() => {
    messageReceivedRealm.delete(receivedMessagesToDelete);
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
  receivedMessages.map(message => receivedMessagesCopy.push({...JSON.parse(JSON.stringify(message))}));

  return [...sentMessagesCopy,...receivedMessagesCopy]
}

const getDeletedReceivedMessages = () => {
  return deletedReceivedRealm.objects('Message').map(message => JSON.parse(JSON.stringify(message)));
}

const getReceivedMessagesForSelf = key => {
  return messageReceivedRealm.objects('Message').filtered(`to == '${key}'`)
  .map(message => JSON.parse(JSON.stringify(message)))
}

const removeCompletedMessagesFromRealm = messages => {
  //get messages sent from this device which have reached their final destination
  const sentMessagesToRemove = messageSentRealm.objects('Message')
  .filter(sentMessage => messages.find(message => message._id == sentMessage._id) != undefined)

  messageSentRealm.write(() => {
    messageSentRealm.delete(sentMessagesToRemove);
  })

  //get messages received, potentially for other users, which have reached their final destination
  const receivedMessagesToDelete = messageReceivedRealm.objects('Message')
  .filter(receivedMessage => messages.find(message => message._id == receivedMessage._id) != undefined)

  messageReceivedRealm.write(() => {
    messageReceivedRealm.delete(receivedMessagesToDelete);
  })
}

const updateMessagesWithContact = async (oldKey, newKey) => {
  //load existing messages
  const sentMessages = messageSentRealm.objects('Message').filtered(`to == '${oldKey}'`);
  const sentMessagesCopy = messageCopyRealm.objects('Message').filtered(`to == '${oldKey}'`);
  const receivedMessages = messageReceivedRealm.objects('Message').filtered(`from == '${oldKey}'`);

  //decrypt, re-encrpyt with new key and write to DB
  let newTexts = [];
  await Promise.all(sentMessagesCopy.map(async message => {
    const decryptedText = await Crypto.decryptString(
      "herdPersonal",
      Crypto.algorithm.RSA,
      Crypto.blockMode.ECB,
      Crypto.padding.OAEP_SHA256_MGF1Padding,
      parseRealmObject(message).text
    )
    const newEncryptedString = await Crypto.encryptStringWithKey(
      newKey,
      Crypto.algorithm.RSA,
      Crypto.blockMode.ECB,
      Crypto.padding.OAEP_SHA256_MGF1Padding,
      decryptedText
    )
    newTexts.push(newEncryptedString);
  }))

  messageSentRealm.write(() => {
    const sentMessages = messageSentRealm.objects('Message');
    sentMessages.map((message,index) => {
      if(message.to == oldKey) {
        message.to = newKey;
        message.text = newTexts[index];
      }
    })
  })

  messageCopyRealm.write(() => {
    const messages = messageCopyRealm.objects('Message');
    messages.map(message => {
      if(message.to == oldKey) {
        message.to = newKey;
      }
    })
  })
  messageReceivedRealm.write(() => {
    const receivedMessages = messageReceivedRealm.objects('Message');
    receivedMessages.map(message => {
      if(message.from == oldKey) {
        message.from = newKey
      }
    })
  })
}

const deleteAllMessages = () => {
  const sentMessages = parseRealmObjects(messageSentRealm.objects('Message'));
  const receivedMessages = parseRealmObjects(messageReceivedRealm.objects('Message'));

  ServiceInterface.removeMessagesFromService([...sentMessages,...receivedMessages]);

  messageSentRealm.write(() => {
    messageSentRealm.deleteAll();
  })
  messageCopyRealm.write(() => {
    messageCopyRealm.deleteAll();
  })
  messageReceivedRealm.write(() => {
    messageReceivedRealm.deleteAll();
  })
  deletedReceivedRealm.write(() => {
    deletedReceivedRealm.deleteAll();
  })
}

const closeChatRealm = () => {
  messageCopyRealm.close();
  messageReceivedRealm.close();
  messageSentRealm.close();
  deletedReceivedRealm.close();
}

export {
  getMessagesWithContact,
  updateMessagesWithContact,
  sendMessageToContact,
  addNewReceivedMessages,
  getContactsWithChats,
  deleteChat,
  deleteAllChats,
  deleteAllMessages,
  deleteMessages,
  getMessageQueue,
  getDeletedReceivedMessages,
  getReceivedMessagesForSelf,
  removeCompletedMessagesFromRealm,
  closeChatRealm,
}
