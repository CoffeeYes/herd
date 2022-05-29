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
    default:
      return state
  }
}

export default chatReducer;
