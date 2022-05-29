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

export {
  deleteChat,
  addChat,
  setChats
}
