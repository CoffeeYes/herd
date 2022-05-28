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

export {
  deleteChat,
  setChats
}
