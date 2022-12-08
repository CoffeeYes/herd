const initialState = {
  chats : [],
  styles : {
    sentBoxColor : "#c6c6c6",
    sentTextColor : "#f5f5f5",
    receivedBoxColor : "#E86252",
    receivedTextColor : "#f5f5f5",
    fontSize : 14
  },
  messageQueue : [],
  messages : {}
}

const chatReducer = (state = initialState,action) => {
  switch(action.type) {
    case "SET_CHATS": {
      return {...state,
        chats : action.payload
      }
      break;
    }
    case "DELETE_CHAT": {
      return {...state,
        chats : [...state.chats].filter(chat => chat._id !== action.payload._id),
        messages : {...state.messages,[action.payload._id] : []},
        messageQueue : [...state.messageQueue].filter(message => message.to !== action.payload.key)
      };
      break;
    }
    case "ADD_CHAT": {
      return {...state, chats : [...state.chats, action.payload]};
      break;
    }
    case "UPDATE_CHAT": {
      const chatToUpdate = state.chats.find(chat => chat._id === action.payload._id);
      if(chatToUpdate) {
        const chatIndex = state.chats.indexOf(chatToUpdate);
        let newChats = [...state.chats];
        newChats[chatIndex] = {...chatToUpdate,name : action.payload.name,key : action.payload.key,image : action.payload.image};
        return {
          ...state,
          chats : newChats,
          messageQueue : [...state.messageQueue].map(message => {
            if(message.to == chatToUpdate.key) {
              return {
                ...message,
                to : action.payload.key,
                toContactName : action.payload.name
              }
            }
          })
        }
      }
      else {
        console.log("NO CHAT TO UPDATE NAME WAS FOUND");
        return state
      }
      break;
    }
    case "ADD_MESSAGE": {
      return {
        ...state,
        messages : {
          ...state.messages,
          [action.payload.id] : state.messages?.[action.payload.id] ?
            [...state.messages[action.payload.id],action.payload.message].sort((a,b) => a.timestamp > b.timestamp)
            :
            [action.payload.message]
        }
      }
      break;
    }
    case "ADD_MESSAGE_TO_QUEUE": {
      return {
        ...state,
        messageQueue : [...state.messageQueue, action.payload.message]
      }
      break;
    }
    case "ADD_MESSAGES_TO_QUEUE": {
      return {
        ...state,
        messageQueue : [...state.messageQueue, ...action.payload]
      }
      break;
    }
    case "REMOVE_MESSAGES_FROM_QUEUE": {
      return {
        ...state,
        messageQueue : [...state.messageQueue].filter
        (message => action.payload.find(id => id == message._id) === undefined)
      }
      break;
    }
    case "FILTER_QUEUE_BY_CONTACT": {
      return {
        ...state,
        messageQueue : [...state.messageQueue].filter
        (message => message.to !== action.payload)
      }
      break;
    }
    case "DELETE_MESSAGES": {
      const chatWithMessagesRemoved = [...state.messages[action.payload.id]].filter
      (message => action.payload.messages.find(messageID => messageID == message._id) === undefined);

      const chatEmpty = chatWithMessagesRemoved.length === 0;

      let chatToUpdate = [...state.chats].find(chat => chat._id === action.payload.id);
      let newChats = [...state.chats];

      if(!chatEmpty) {
        const last = chatWithMessagesRemoved.length -1
        const updateIndex = state.chats.indexOf(chatToUpdate);
        chatToUpdate.lastText = chatWithMessagesRemoved[last].text;
        chatToUpdate.timestamp = chatWithMessagesRemoved[last].timestamp;
        if(updateIndex) {
          newChats[updateIndex] = chatToUpdate;
        }
      }
      return {...state,
        messages : {
          ...state.messages,
           [action.payload.id] : chatWithMessagesRemoved
         },
         chats : newChats
       }
      break;
    }
    case "RESET_MESSAGES": {
      return {...state,
        messages : {},
        chats : []
      };
      break;
    }
    case "SET_LAST_TEXT": {
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
    }
    case "SET_STYLES": {
      return {...state,styles : action.payload}
      break;
    }
    case "SET_MESSAGE_QUEUE": {
      return {...state, messageQueue : action.payload}
      break;
    }
    case "SET_MESSAGES_FOR_CONTACT": {
      return {...state,messages : {...state.messages,[action.payload.id] : action.payload.messages}}
      break;
    }
    case "PREPEND_MESSAGES_FOR_CONTACT": {
      let newState = {...state}
      if(!state.messages[action.payload.id]) {
        newState.messages[action.payload.id] = []
      }

      const newMessages = [...action.payload.messages]
      .filter(message => newState.messages[action.payload.id].find(
        existingMessage => existingMessage._id == message._id) == undefined
      );

      return {...newState, messages : {
        ...newState.messages,
        [action.payload.id] : [
          ...newMessages,
          ...newState.messages[action.payload.id]
        ].sort((a,b) => a.timestamp > b.timestamp)
      }}
      break;
    }
    default:
      return state
  }
}

export default chatReducer;
