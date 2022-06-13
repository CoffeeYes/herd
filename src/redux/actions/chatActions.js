const setChats = chats => {
  return {
    type : "SET_CHATS",
    payload : chats
  }
}

const deleteChat = chat => {
  return {
    type : "DELETE_CHAT",
    payload : chat
  }
}

const addChat = chat => {
  return {
    type : "ADD_CHAT",
    payload : chat
  }
}

const setLastText = newText => {
  return {
    type : "SET_LAST_TEXT",
    payload : newText
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

const setMessagesForContact = (id, messages) => {
  return{
    type : "SET_MESSAGES_FOR_CONTACT",
    payload : {id : id, messages : messages}
  }
}

export {
  deleteChat,
  addChat,
  setChats,
  setStyles,
  setLastText,
  setMessageQueue,
  setMessagesForContact
}
