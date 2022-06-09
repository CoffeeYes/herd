const initialState = {
  chats : [],
  styles : {
    fontSize : 14,
    sentTextColor : "red",
    receivedTextColor : "red",
    sentBoxColor : "red",
    receivedBoxColor : "red"
  },
  messageQueue : []
}

const chatReducer = (state = initialState,action) => {
  switch(action.type) {
    case "SET_CHATS":
      return {...state, chats : action.payload};
      break;
    case "DELETE_CHAT":
      return {...state, chats : [...state.chats].filter(chat => chat._id !== action.payload._id)};
      break;
    case "ADD_CHAT":
      return {...state, chats : [...state.chats, action.payload]};
      break;
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
      break;
    case "SET_STYLES":
      return {...state,styles : action.payload}
      break;
    case "SET_MESSAGE_QUEUE":
      return {...state, messageQueue : action.payload}
    default:
      return state
  }
}

export default chatReducer;
