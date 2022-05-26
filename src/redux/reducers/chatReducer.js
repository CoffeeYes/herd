const initialState = {
  chats : []
}
const chatReducer = (state = initialState,action) => {
  switch(action.type) {
    case "SET_CHATS":
      return {...state, chats : action.payload};
    default:
      return state
  }
}

export default chatReducer;
