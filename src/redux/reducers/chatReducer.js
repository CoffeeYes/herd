const initialState = {
  chats : [],
  styles : {
    fontSize : 14,
    sentTextColor : "red",
    receivedTextColor : "red",
    sentBoxColor : "red",
    receivedBoxColor : "red"
  },
  messageQueue : [],
  messages : {}
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
    case "ADD_MESSAGE":
      return {...state, messages : {...state.messages,[action.payload.id] : [...state.messages[action.payload.id],action.payload.message]}}
      break;
    case "DELETE_MESSAGES":
      return {...state,
        messages : {
          ...state.messages,
           [action.payload.id] : [...state.messages[action.payload.id]].filter
           (message => action.payload.messages.find(messageID => messageID == message._id) === undefined)
         }
       }
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
      return state;
      break;
    case "SET_STYLES":
      return {...state,styles : action.payload}
      break;
    case "SET_MESSAGE_QUEUE":
      return {...state, messageQueue : action.payload}
      break;
    case "SET_MESSAGES_FOR_CONTACT":
      return {...state,messages : {...state.messages,[action.payload.id] : action.payload.messages}}
      break;
    case "PREPEND_MESSAGES_FOR_CONTACT":
      let newState = {...state}
      if(!state.messages[action.payload.id]) {
        newState.messages[action.payload.id] = []
      }
      return {...newState, messages : {
        ...newState.messages,
        [action.payload.id] : [
          ...action.payload.messages,
          ...newState.messages[action.payload.id]
        ]
      }}
      break;
    default:
      return state
  }
}

export default chatReducer;
