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

export {
  deleteChat,
  addChat,
  setChats,
  setLastText
}
