
const initialState = {
  contacts : []
}

const contactReducer = (state = initialState,action) => {
  switch(action.type) {
    case "SET_CONTACTS":
      return {...state, contacts : action.payload}
    case "ADD_CONTACT":
      return {...state, contacts : [...state.contacts,action.payload]}
    case "DELETE_CONTACT":
      return {...state, contacts : [...state.contacts].filter(contact => contact.id !== action.payload.id)}
    default:
      return state;
  }
}

export default contactReducer;
