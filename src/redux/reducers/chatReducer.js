const initialState = {
  chats : []
}
const chatReducer = (state = initialState,action) => {
  switch(action.type) {
    case "SET_CHATS":
      return {...state, chats : action.payload};
    case "DELETE_CHAT":
      return {...state, chats : [...state.chats].filter(chat => chat._id !== action.payload._id)};
    case "ADD_CHAT":
      return {...state, chats : [...state.chats, action.payload]};
    case "SET_LAST_TEXT":
      let chat = state.chats.find(chat => chat._id == action.payload._id);
      if(chat) {
        let chats = [...state.chats];
        const chatIndex = chats.indexOf(chat);
        chat.lastText = action.payload.lastText;
        chat.timestamp = action.payload.timestamp;
        chats[chatIndex] = chat;
        return {...state,chats : chats};
      }
    default:
      return state
  }
}

export default chatReducer;
