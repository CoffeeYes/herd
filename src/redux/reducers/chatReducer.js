import { defaultChatStyles } from '../../assets/styles'
import { timestampToText } from '../../helper';

const generateMessageDays = (existingMessages = [], newMessages, reverseOrder = true) => {
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
  for (let date of dates) {
    date.data.sort((a,b) => a.timestamp - b.timestamp);
    reverseOrder && date.data.reverse();
  }
  dates.sort((a,b) => a.data[a.data.length -1].timestamp - b.data[b.data.length -1].timestamp);
  reverseOrder && dates.reverse();
  return dates;
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

  for(const [key,value] of Object.entries(newValues)) {
    if(typeof value === "undefined" || value === null) {
      throw new Error(`[updateChat] : passed invalid value '${value}' for key '${key}' when attempting to update chat`)
    }
    else if(!updateableValues.includes(key) && key !== "_id") {
      throw new Error(`[updateChat] : invalid key '${key}' passed when attempting to update chat`)
    }
    else {
      updatedChat[key] = value;
    }
  }

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
    }
    case "DELETE_CHATS": {
      return {...state,
        chats : [...state.chats].filter(
          chat => action.payload.find(
          chatToDelete => chatToDelete._id == chat._id) === undefined
        )
      };
    }
    case "ADD_CHAT": {
      return {...state, chats : [...state.chats, action.payload]};
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
    }
    case "ADD_MESSAGES_TO_QUEUE": {
      return {
        ...state,
        messageQueue : [...state.messageQueue, ...action.payload]
      }
    }
    case "REMOVE_MESSAGES_FROM_QUEUE": {
      return {
        ...state,
        messageQueue : [...state.messageQueue].filter
        (message => !action.payload.includes(message._id))
      }
    }
    case "FILTER_QUEUE_BY_KEYS": {
      return {
        ...state,
        messageQueue : [...state.messageQueue].filter
        (message => !action.payload.includes(message.to))
      }
    }
    case "DELETE_MESSAGES": {
      const { id, messageIDs } = action.payload;

      const newSections = state.messages[id].map(section => ({
        ...section,
        data : [...section.data].filter(message => !messageIDs.includes(message._id))}
      ))
      .filter(section => section.data.length !== 0)

      const lastSection = newSections[0]?.data
      const lastMessage = lastSection && lastSection[0];

      const newState = {
        ...state,
        ...(lastMessage && {chats : setLastText(state,id,lastMessage)}),
        messages : {
          ...state.messages,
          [id] : newSections
        }
      }
      return newState;
    }
    case "RESET_MESSAGES": {
      return {...state,
        messages : {},
        chats : []
      };
    }
    case "SET_LAST_TEXT": {
      const {id, message} = action.payload;
      return {
        ...state,
        chats : setLastText(state,id,message)
      }
    }
    case "SET_STYLES": {
      let oldStyles = {...state.styles};
      const newStyles = {...oldStyles,...action.payload}
      return {...state, styles : newStyles}
    }
    case "SET_MESSAGE_QUEUE": {
      return {...state, messageQueue : action.payload}
    }
    case "UPDATE_MESSAGE_QUEUE": {
      const chatToUpdate = state.chats.find(chat => chat._id === action.payload._id);
      if(chatToUpdate) {
        return {
          ...state,
          messageQueue : updateMessageQueue(
            state.messageQueue,
            chatToUpdate.key,
            action.payload.key,
            action.payload.name
          )
        }
      }
      else {
        return state;
      }
    }
    case "SET_MESSAGES_FOR_CONTACTS": {
      let messagesCopy = {...state.messages};
      for(const item of action.payload) {
        messagesCopy[item.id] = item.messages;
      }
      return {...state,
        messages : messagesCopy
      }
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
    }
    default:
      return state
  }
}

export default chatReducer;
