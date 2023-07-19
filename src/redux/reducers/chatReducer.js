import { defaultChatStyles } from '../../assets/styles'
import { timestampToText } from '../../helper';

const generateMessageDays = (existingMessages = [], newMessages) => {
  let dates = [...existingMessages]
  for(let message of newMessages) {
    let messageDate = timestampToText(message.timestamp, "DD/MM");
    const existingDate = dates.find(item => item.day === messageDate)
    //append message to existing date entry if it is a new message
    if(existingDate) {
      existingDate.data.find(existingMessage => existingMessage._id === message._id) === undefined &&
      existingDate.data.push(message)
    }
    //first message with this date, initialise message array for this date
    else {
      dates.push({day : messageDate, data : [message]})
    }
  }
  for (date of dates) {
    date.data.sort((a,b) => a.timestamp > b.timestamp)
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

  Object.entries(newValues).map((key,value) => {
    if(typeof value === "undefined" || value === null) {
      throw new Exception(`[updateChat] : passed invalid value '${value}' for key '${key}' when attempting to update chat`)
    }
    else if(!updateableValues.includes(key)) {
      throw new Exception(`[updateChat] : invalid key '${key}' passed when attempting to update chat`)
    }
    else {
      updatedChat[key] = value;
    }
  })

  return updatedChat;
}

const updateMessageQueue = (messageQueue, originalKey, newKey, newName) => {
  const updatedQueue = messageQueue.map(message => {
    if(message.to == originalKey) {
      return {
        ...message,
        ...(newKey?.length > 0 && {to : newKey}),
        ...(newName?.length > 0 && {toContactName : newName})
      }
    }
    else return message;
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
    case "DELETE_CHATS": {
      return {...state,
        chats : [...state.chats].filter(
          chat => action.payload.find(
          chatToDelete => chatToDelete._id == chat._id) === undefined
        )
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
          chats : newChats
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
        (message => !action.payload.includes(message._id))
      }
      break;
    }
    case "FILTER_QUEUE_BY_KEYS": {
      return {
        ...state,
        messageQueue : [...state.messageQueue].filter
        (message => !action.payload.includes(message.to))
      }
      break;
    }
    case "DELETE_MESSAGES": {
      const { id, messageIDs } = action.payload;

      const newSections = state.messages[id].map(section => ({
        ...section,
        data : [...section.data].filter(message => !messageIDs.includes(message._id))}
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
    case "UPDATE_MESSAGE_QUEUE": {
      const chatToUpdate = state.chats.find(chat => chat._id === action.payload._id);
      if(chatToUpdate) {
        return {
          ...state,
          messageQueue : updateMessageQueue(state.messageQueue,{...chatToUpdate}.key,action.payload.key,action.payload.name)
        }
      }
      else {
        return state;
      }
      break;
    }
    case "SET_MESSAGES_FOR_CONTACTS": {
      let messagesCopy = {...state.messages};
      for(const item of action.payload) {
        messagesCopy[item.id] = item.messages;
      }
      return {...state,
        messages : messagesCopy
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
