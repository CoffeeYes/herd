import Realm from 'realm';
import Schemas from './Schemas';
import Crypto from '../nativeWrapper/Crypto';
import ServiceInterface from '../nativeWrapper/ServiceInterface';
import { getContactsByKey, createContact } from './contactRealm';
import { parseRealmObject, parseRealmObjects, getUniqueKeysFromMessages} from '../helper';
import { decryptStrings, encryptStrings, storeChatsWithNewMessages } from '../common';

import { addMessagesToQueue, addMessage, setChats } from '../redux/actions/chatActions';
import { addContact } from '../redux/actions/contactActions';

const messageCopyRealmConfig = {
  path : "MessagesCopy",
  schema: [Schemas.MessageSchema],
}

const messageReceivedRealmConfig = {
  path : "MessagesReceived",
  schema: [Schemas.MessageSchema],
}

const messageSentRealmConfig = {
  path : "MessagesSent",
  schema : [Schemas.MessageSchema]
}

const deletedReceivedRealmConfig = {
  path : "MessagesReceivedAndDeleted",
  schema : [Schemas.MessageSchema]
}

let messageCopyRealm;

let messageReceivedRealm;

let messageSentRealm;

let deletedReceivedRealm;

const decryptMessages = async messages => {
  try {
    const decryptedMessages = await decryptStrings(
      messages.map(message => message.text)
    );
    let parsedMessages = parseRealmObjects(messages);
    parsedMessages.forEach((message,index) => {
      message.text = decryptedMessages[index]
    })
    return parsedMessages;
  }
  catch(e) {
    console.log("error decrypting messages : ",e)
  }
}

const getMessagesWithContact = async (key, startIndex, endIndex) => {
  const ownKey = await Crypto.loadKeyFromKeystore('herdPersonal');

  let sentMessagesCopy = messageCopyRealm.objects("Message")?.filtered(`to = '${key}'`).slice(startIndex,endIndex);
  let receivedMessages = messageReceivedRealm.objects("Message")?.filtered(`from = '${key.trim()}' AND to = '${ownKey.trim()}'`).slice(startIndex,endIndex);

  //on initial load, ensure messages up to the earliest timestamp are loaded so that
  //they aren't only loaded much later and dont make the message order incorrect
  const firstSent = sentMessagesCopy[0];
  const firstReceived = receivedMessages[0];

  //check if there are messages and this is the first load
  const haveMessages = firstSent && firstReceived;
  const initialLoad = startIndex == -5 && haveMessages;

  if(startIndex == -5 && haveMessages) {
    if(firstReceived.timestamp < firstSent.timestamp) {
      sentMessagesCopy = messageCopyRealm.objects("Message")?.filtered(`timestamp > '${firstReceived.timestamp}'`)
    }
    else {
      receivedMessages = messageReceivedRealm.objects("Message")
      ?.filtered(`from = '${key.trim()}' AND to = '${ownKey.trim()}' AND timestamp > '${firstSent.timestamp}'`)
    }
  }

  const decryptedMessages = await decryptMessages([...sentMessagesCopy,...receivedMessages]);

  let payload = {
    messages : decryptedMessages.sort( (a,b) => a.timestamp - b.timestamp)
  }

  //calculate new indices to send to frontend based on the sizes of the received/sent message arrays
  if(initialLoad) {
    let highestMessageIndex, lowestMessageIndex;
    if(firstReceived.timestamp < firstSent.timestamp) {
      highestMessageIndex = -sentMessagesCopy.length;
      lowestMessageIndex = -receivedMessages.length;
    }
    else {
      highestMessageIndex = -receivedMessages.length;
      lowestMessageIndex = -sentMessagesCopy.length;
    }

    payload = {
      ...payload,
      newStart : highestMessageIndex,
      newEnd : lowestMessageIndex
    }
  }

  return payload;
}

const sendMessageToContact = (metaData, encrypted, selfEncryptedCopy) => {

  const messageID = Realm.BSON.ObjectId();

  const messageData = {
    ...metaData,
    _id : messageID
  }

  messageCopyRealm.write(() => {
    messageCopyRealm.create("Message",{
      ...messageData,
      text : selfEncryptedCopy,
    })
  });

  messageSentRealm.write(() => {
    messageSentRealm.create("Message",{
      ...messageData,
      text : encrypted,
    })
  });

  return messageID.toString();
}

const addNewReceivedMessages = async (messages,dispatch, currentChat) => {
  const receivedMessages = parseRealmObjects(messageReceivedRealm.objects("Message"));
  const deletedReceivedMessages = parseRealmObjects(deletedReceivedRealm.objects("Message"));
  const ownPublicKey = await Crypto.loadKeyFromKeystore('herdPersonal');
  const messagesToAvoidIDs = [
    ...receivedMessages.map(message => message._id),
    ...deletedReceivedMessages.map(message => message._id)
  ]
  const newMessages = messages.filter(message => !messagesToAvoidIDs.includes(message._id))
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
    dispatch(addMessagesToQueue(newMessages.filter(message => message.to.trim() !== ownPublicKey.trim())));

    let messagesForSelf = newMessages.filter(message => message.to.trim() == ownPublicKey.trim())
    const contactKeysWithNewMessages = getUniqueKeysFromMessages(messagesForSelf,"from");
    const contactsWithNewMessages = getContactsByKey(contactKeysWithNewMessages);
    const contactsWithNewMessagesIDs = contactsWithNewMessages.map(contact => contact._id);

    const decryptedMessages = await decryptStrings(
      messagesForSelf.map(message => message.text)
    )

    messagesForSelf.forEach((message,index) => {
      message.text = decryptedMessages[index]
      let contact = contactsWithNewMessages.find(contact => contact.key.trim() == message.from.trim());
      //if message for user has been received but the sender isn't in their address book, add an unkown contact
      //to file the message under
      if(!contact) {
        contact = createContact({
          name : "Unknown User",
          key : message.from.trim(),
          image : "",
          hasNewMessages : true
        });
        contactsWithNewMessages.push(contact);
        dispatch(addContact(contact));
      }
      dispatch(addMessage(contact._id,message))
    })
    let chats = await getContactsWithChats();
    chats.forEach((chat,index) => {
      if(contactsWithNewMessagesIDs.includes(chat._id)) {
        if(chat._id != currentChat) {
          chats[index].hasNewMessages = true
        }
        chats[index].doneLoading = false;
      }
    })
    await storeChatsWithNewMessages(chats);
    dispatch(setChats(chats))
  }
}

const getContactsWithChats = async () => {
  //get all messages sent and received
  const sentMessages = messageCopyRealm.objects('Message');
  const receivedMessages = messageReceivedRealm.objects('Message');

  let keys = [
    ...getUniqueKeysFromMessages(sentMessages,"to"),
    ...getUniqueKeysFromMessages(receivedMessages,"from"),
  ];

  let contacts = getContactsByKey(keys);
  for(let contact of contacts) {
    const messages = (await getMessagesWithContact(contact.key,-1)).messages;
    const lastMessage = messages.sort((a,b) => b.timestamp - a.timestamp)[0];
    if(lastMessage) {
      contact.timestamp = lastMessage.timestamp;
      contact.lastText = lastMessage.text;
      contact.lastMessageSentBySelf = lastMessage.from !== contact.key;
    }
  }
  const contactsWithChats = contacts.filter(contact => contact.timestamp);
  return contactsWithChats
}

const deleteChats = keys => {
  const sentMessagesToDelete = messageSentRealm.objects('Message').filter(message => keys.includes(message.to));
  const sentMessagesToDeleteCopy = messageCopyRealm.objects('Message').filter(message => keys.includes(message.to));
  const receivedMessagesToDelete = messageReceivedRealm.objects('Message').filter(message => keys.includes(message.from));

  ServiceInterface.removeMessagesFromService(sentMessagesToDelete.map(message => message._id));

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

  ServiceInterface.removeMessagesFromService(sentMessages.map(message => message._id));

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

const findMessagesById = (realm,messages = []) => {
  return messages.map(id =>
    realm.objectForPrimaryKey('Message',Realm.BSON.ObjectId(id))
  ).filter(message => message !== undefined);
}

const findAndDeleteMessages = (realm, messages = []) => {
  const messagesToDelete = findMessagesById(realm,messages);

  messagesToDelete.length > 0 &&
  realm.write(() => {
    realm.delete(messagesToDelete)
  })
}

const deleteMessages = messages => {

  findAndDeleteMessages(messageCopyRealm,messages);
  findAndDeleteMessages(messageSentRealm,messages);

  const receivedMessagesToDelete = findMessagesById(messageReceivedRealm,messages);

  //add deleted received messages to seperate realm to prevent them from being
  //re-added in the future
  deletedReceivedRealm.write(() => {
    receivedMessagesToDelete.forEach(message => deletedReceivedRealm.create('Message',message,true))
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
  const targetRealmForSentMessages = useMessageCopies ? messageCopyRealm : messageSentRealm;
  const sentMessages = targetRealmForSentMessages.objects('Message');
  const key = (await Crypto.loadKeyFromKeystore("herdPersonal"))?.trim();
  const receivedMessages = messageReceivedRealm.objects('Message').filtered(`to != '${key}'`)

  const sentMessagesCopy = parseRealmObjects(sentMessages);
  const receivedMessagesCopy = parseRealmObjects(receivedMessages);

  return [...sentMessagesCopy,...receivedMessagesCopy]
}

const getDeletedReceivedMessages = () => {
  return parseRealmObjects(deletedReceivedRealm.objects('Message'));
}

const getReceivedMessagesForSelf = async () => {
  const ownKey = await Crypto.loadKeyFromKeystore('herdPersonal');
  return parseRealmObjects(messageReceivedRealm.objects('Message').filtered(`to == '${ownKey}'`))
}

const removeCompletedMessagesFromRealm = messages => {
  const messageIDs = messages.map(message => Realm.BSON.ObjectId(message._id));
  //get messages sent from this device which have reached their final destination
  const sentMessagesToRemove = messageSentRealm.objects('Message').filtered(`_id in $0`,messageIDs);

  messageSentRealm.write(() => {
    messageSentRealm.delete(sentMessagesToRemove);
  })

  //get messages received, potentially for other users, which have reached their final destination
  const receivedMessagesToDelete = messageReceivedRealm.objects('Message').filtered(`_id in $0`,messageIDs);

  messageReceivedRealm.write(() => {
    messageReceivedRealm.delete(receivedMessagesToDelete);
  })
}

const updateMessagesWithContact = async (oldKey, newKey) => {
  //load existing messages
  const sentMessages = messageSentRealm.objects('Message').filtered(`to == '${oldKey}'`);
  const sentMessagesCopy = messageCopyRealm.objects('Message').filtered(`to == '${oldKey}'`);
  const receivedMessages = messageReceivedRealm.objects('Message').filtered(`from == '${oldKey}'`);

  messageReceivedRealm.write(() => {
    for (const message of receivedMessages) {
      message.from = newKey
    }
  })

  if(sentMessagesCopy.length == 0) {
    return true;
  }

  const decryptedStrings = await decryptStrings(
    sentMessagesCopy.map(message => parseRealmObject(message).text)
  )

  const newTexts = await encryptStrings(
    newKey,
    false,
    decryptedStrings 
  )

  if(newTexts.length > 0) {
    messageSentRealm.write(() => {
      for(const [index,message] of sentMessages.entries()) {
        message.to = newKey;
        message.text = newTexts[index];
      }
    })

    messageCopyRealm.write(() => {
      for (const message of sentMessagesCopy) {
        message.to = newKey;
      }
    })

    return true;
  }
  else {
    return false;
  }
}

const deleteAllMessages = () => {
  const sentMessages = parseRealmObjects(messageSentRealm.objects('Message'));
  const receivedMessages = parseRealmObjects(messageReceivedRealm.objects('Message'));
  
  ServiceInterface.removeMessagesFromService([...sentMessages,...receivedMessages].map(message => message._id));

  [messageSentRealm,messageCopyRealm,messageReceivedRealm,deletedReceivedRealm]
  .map(realm => {
    realm.write(() => realm.deleteAll());
  })
}

const openChatRealm = async () => {
  messageCopyRealm = await Realm.open(messageCopyRealmConfig);
  messageSentRealm = await Realm.open(messageSentRealmConfig);
  messageReceivedRealm = await Realm.open(messageReceivedRealmConfig);
  deletedReceivedRealm = await Realm.open(deletedReceivedRealmConfig);
}

const closeChatRealm = () => {
  messageCopyRealm.close();
  messageReceivedRealm.close();
  messageSentRealm.close();
  deletedReceivedRealm.close();
}

const deleteChatRealm = () => {
  Realm.deleteFile(messageCopyRealmConfig);
  Realm.deleteFile(messageReceivedRealmConfig);
  Realm.deleteFile(messageSentRealmConfig);
  Realm.deleteFile(deletedReceivedRealmConfig);
}

export {
  getMessagesWithContact,
  updateMessagesWithContact,
  sendMessageToContact,
  addNewReceivedMessages,
  getContactsWithChats,
  deleteChats,
  deleteAllChats,
  deleteAllMessages,
  deleteMessages,
  getMessageQueue,
  getDeletedReceivedMessages,
  getReceivedMessagesForSelf,
  removeCompletedMessagesFromRealm,
  openChatRealm,
  closeChatRealm,
  deleteChatRealm
}
