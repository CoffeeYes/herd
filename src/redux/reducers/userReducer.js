import { setPublicKey } from '../actions/userActions';

const initialState = {
  publicKey : "",
  loginPasswordHash : "",
  erasurePasswordHash : ""
}

const userReducer = (state = initialState, action) => {
  switch(action.type) {
    case "SET_PUBLIC_KEY":
      return {...state,publicKey : action.payload}
    case "SET_LOGIN_PASSWORD":
      return {...state,publicKey : action.payload}
    case "SET_ERASURE_PASSWORD":
      return {...state,publicKey : action.payload}
    default:
      return state
  }
}

export default userReducer;
