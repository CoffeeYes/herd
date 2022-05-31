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

export {
  deleteChat,
  addChat,
  setChats,
  setStyles,
  setLastText
}
