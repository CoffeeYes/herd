import moment from 'moment';
import { defaultChatStyles } from '../../assets/styles'

const generateMessageDays = (existingMessages = [], newMessages) => {
  let dates = [...existingMessages]
  for(let message of newMessages) {
    if(message) {
      let messageDate = moment(message.timestamp).format("DD/MM");
      const existingDate = dates.find(item => item.day === messageDate)
      if(existingDate) {
        existingDate.data.find(existingMessage => existingMessage._id === message._id) === undefined &&
        existingDate.data.push(message)
      }
      else {
        dates.push({day : messageDate, data : [message]})
      }
    }
  }
  for (date of dates) {
    date.data = date.data.sort((a,b) => a.timestamp > b.timestamp)
  }
  return dates.sort((a,b) => a.data[a.data.length -1].timestamp > b.data[b.data.length -1].timestamp)
}

const initialState = {
  chats : [],
  styles : defaultChatStyles,
  messageQueue : [],
  messages : {}
}

const setLastText = (state, id, message) => {
  let chat = state.chats.find(chat => chat._id == id);
  if(chat) {
    let chats = [...state.chats];
    const chatIndex = chats.indexOf(chat);
    chat.lastText = message.text;
    chat.timestamp = message.timestamp;
    chats[chatIndex] = chat;
    return chats;
  }
  else {
    return state.chats
  }
}

const updateChat = (originalChat, newValues) => {
  let updatedChat = {...originalChat};
  const updateableValues = ["name","key","image", "doneLoading"];

  Object.keys(newValues).map(key => {
    if(updateableValues.indexOf(key) != -1) {
      updatedChat[key] = newValues[key];
    }
  })

  return updatedChat;
}

const updateMessageQueue = (messageQueue, originalKey, newKey, newName) => {
  const updatedQueue = messageQueue.map(message => {
    if(message.to == originalKey) {
      return {
        ...message,
        ...(newKey && {to : newKey}),
        ...(newName && {toContactName : newName})
      }
    }
  })
  return updatedQueue;
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
        newChats[chatIndex] = updateChat(newChats[chatIndex],action.payload);
        return {
          ...state,
          chats : newChats,
          ...( (action?.payload?.key || action?.payload?.name) && {
            messageQueue : updateMessageQueue(state.messageQueue,chatToUpdate.key,action.payload.key,action.payload.name)
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
      const { message, id } = action.payload
      const newState = {
        ...state,
        messages : {
          ...state.messages,
          [id] : generateMessageDays(state.messages[id],[message])
        }
      };
      return newState;
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
        (message => action.payload.find(item => item._id == message._id) === undefined)
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
      const { id, messages } = action.payload;

      const newSections = state.messages[id].map(section => ({
        ...section,
        data : [...section.data].filter(message => messages.indexOf(message) === -1 )}
      ))
      .filter(section => section.data.length !== 0)

      const newState = {
        ...state,
        messages : {
          ...state.messages,
          [id] : newSections
        }
      }
      return newState;
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
      const {id, message} = action.payload;
      return {
        ...state,
        chats : setLastText(state,id,message)
      }
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
      return {...state,
        messages : {
          ...state.messages,
          [action.payload.id] : action.payload.messages
        }
      }
      break;
    }
    case "PREPEND_MESSAGES_FOR_CONTACT": {
      const {id, messages} = action.payload
      const newState = {
        ...state,
        messages : {
          ...state.messages,
          [id] : generateMessageDays(state.messages[id],messages)
        }
      }
      return newState;
      break;
    }
    default:
      return state
  }
}

export default chatReducer;
