const initialState = {
  publicKey : "",
  loginPasswordHash : "",
  erasurePasswordHash : ""
}

const userReducer = (state = initialState, action) => {
  switch(action.type) {
    case "SET_PUBLIC_KEY":
      return {...state,publicKey : action.payload}
    case "SET_PASSWORD": {
      const {hash, passwordName} = action.payload;
      return {
        ...state,
        [passwordName + "PasswordHash"] : hash
      }
    }
    default:
      return state
  }
}

export default userReducer;
