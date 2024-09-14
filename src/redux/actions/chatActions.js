const setChats = chats => {
  return {
    type : "SET_CHATS",
    payload : chats
  }
}

const deleteChats = chats => {
  return (dispatch,getState) => {
    const chatsToDelete = chats == "all" ? getState().chatReducer.chats : chats;
    dispatch({type : "DELETE_CHATS",payload : chatsToDelete});
    dispatch(filterMessageQueueByKeys(chatsToDelete.map(chat => chat.key)));
    let messagesForContacts = [];
    if(chatsToDelete[0]?._id) {
      messagesForContacts = chatsToDelete.map(chat => ({id : chat._id, messages : []}))
    }
    else {
      messagesForContacts = chatsToDelete.map(id => ({id, messages : []}))
    }
    dispatch(setMessagesForContacts(messagesForContacts))
  }
}

const addChat = chat => {
  return {
    type : "ADD_CHAT",
    payload : chat
  }
}

const updateChat = contact => {
  return (dispatch,getState) => {
    //must update queue before contact, otherwise updateQueue function has
    //no old contact key to compare against
    (contact?.key?.length > 0 || contact?.name?.length > 0) &&
    dispatch(updateMessageQueue(contact));

    dispatch({type : "UPDATE_CHAT",payload : contact})
  }
}

const addMessage = (id, message) => {
  return async (dispatch,getState) => {
    dispatch({type : "ADD_MESSAGE",payload : {id,message}});
    dispatch(setLastText(id,message));
  }
}

const addMessagesToQueue = messages => {
  return {
    type : "ADD_MESSAGES_TO_QUEUE",
    payload : messages
  }
}

const updateMessageQueue = contact => {
  return {
    type : "UPDATE_MESSAGE_QUEUE",
    payload : contact
  }
}

const removeMessagesFromQueue = messageIDs => {
  return {
    type : "REMOVE_MESSAGES_FROM_QUEUE",
    payload : messageIDs
  }
}

const filterMessageQueueByKeys = keys => {
  return {
    type : "FILTER_QUEUE_BY_KEYS",
    payload : keys
  }
}

const deleteMessages = (id, messageIDs) => {
  return (dispatch, getState) => {
    dispatch({type : "DELETE_MESSAGES",payload : {id,messageIDs}});
    dispatch(removeMessagesFromQueue(messageIDs));
  }
}

const resetMessages = () => {
  return {
    type : "RESET_MESSAGES"
  }
}

const setLastText = (id, message) => {
  return {
    type : "SET_LAST_TEXT",
    payload : {id,message}
  }
}

const setStyles = styles => {
  return {
    type : "SET_STYLES",
    payload : styles
  }
}

const setMessageQueue = queue => {
  return {
    type : "SET_MESSAGE_QUEUE",
    payload : queue
  }
}

const setMessagesForContacts = contactsArray => {
  //expects array in format [{id : <contactID>,messages : <contactMessages>}, ...]
  return {
    type : "SET_MESSAGES_FOR_CONTACTS",
    payload : contactsArray
  }
}

const prependMessagesForContact = (id, messages) => {
  return {
    type : "PREPEND_MESSAGES_FOR_CONTACT",
    payload : {id : id,messages : messages}
  }
}

export {
  deleteChats,
  addChat,
  updateChat,
  setChats,
  addMessage,
  addMessagesToQueue,
  removeMessagesFromQueue,
  filterMessageQueueByKeys,
  deleteMessages,
  resetMessages,
  setStyles,
  setLastText,
  setMessageQueue,
  setMessagesForContacts,
  prependMessagesForContact
}
