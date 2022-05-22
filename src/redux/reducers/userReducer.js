import { setPublicKey } from '../actions/userActions';

const initialState = {
  publicKey : ""
}

const userReducer = (state = initialState, action) => {
  switch(action.type) {
    case "SET_PUBLIC_KEY":
      return {...state,publicKey : action.payload}
    default:
      return state
  }
}

export default userReducer;
