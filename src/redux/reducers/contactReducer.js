
const initialState = {
  contacts : []
}

const contactReducer = (state = initialState,action) => {
  switch(action.type) {
    case "SET_CONTACTS":
      return {...state, contacts : action.payload}
      break;
    case "ADD_CONTACT":
      if(state.contacts.indexOf(action.payload) === -1) {
        return {...state, contacts : [...state.contacts,action.payload]}
      }
      else {
        return state
      }
      break;
    case "DELETE_CONTACT":
      return {...state, contacts : [...state.contacts].filter(contact => contact.id !== action.payload.id)}
      break;
    case "UPDATE_CONTACT":
      let contact = state.contacts.find(contact => contact._id == action.payload._id);
      if(contact) {
        let contactsCopy = [...state.contacts];
        const contactIndex = state.contacts.indexOf(contact);
        contactsCopy[contactIndex] = action.payload;
        return {...state, contacts : contactsCopy}
      } else {
        return state;
      }
      break;
    default:
      return state;
  }
}

export default contactReducer;
