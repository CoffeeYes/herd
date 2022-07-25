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
      return {...state,
        chats : action.payload,
        messages : action.payload.length === 0 ? {} : {...state.messages}
      }
      break;
    case "DELETE_CHAT":
      return {...state,
        chats : [...state.chats].filter(chat => chat._id !== action.payload._id),
        messages : {...state.messages,[action.payload._id] : []},
        messageQueue : [...state.messageQueue].filter(message => message.to !== action.payload.key)
      };
      break;
    case "ADD_CHAT":
      return {...state, chats : [...state.chats, action.payload]};
      break;
    case "ADD_MESSAGE":
      return {
        ...state,
        messages : {
          ...state.messages,
          [action.payload.id] : [...state.messages[action.payload.id],action.payload.message]}
      }
      break;
    case "ADD_MESSAGE_TO_QUEUE":
      return {
        ...state,
        messageQueue : [...state.messageQueue, action.payload.message]
      }
      break;
    case "ADD_MESSAGES_TO_QUEUE":
      return {
        ...state,
        messageQueue : [...state.messageQueue, ...action.payload]
      }
      break;
    case "REMOVE_MESSAGES_FROM_QUEUE":
      return {
        ...state,
        messageQueue : [...state.messageQueue].filter
        (message => action.payload.find(id => id == message._id) === undefined)
      }
      break;
    case "FILTER_QUEUE_BY_CONTACT":
      return {
        ...state,
        messageQueue : [...state.messageQueue].filter
        (message => message.to !== action.payload)
      }
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
    case "RESET_MESSAGES":
      return {...state,
        messages : {},
        chats : []
      };
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
