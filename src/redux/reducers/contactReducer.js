
const initialState = {
  contacts : []
}

const contactReducer = (state = initialState,action) => {
  switch(action.type) {
    case "SET_CONTACTS":
      return {...state, contacts : action.payload}
      break;
    case "ADD_CONTACT":
      return {...state, contacts : [...state.contacts,action.payload]};
      break;
    case "DELETE_CONTACT":
      return {...state, contacts : [...state.contacts].filter(contact => contact._id !== action.payload._id)}
      break;
    case "UPDATE_CONTACT": {
      const { _id, name, key, image } = action.payload;
      let contact = state.contacts.find(contact => contact._id == _id);
      if(contact) {
  	    let contactsCopy = [...state.contacts];
    	  let newContact  = {
    	      ...contact,
    	      ...(name && {name : name}),
    	      ...(image && {image : image}),
    	      ...(key && {key : key}),
    	  };
        const contactIndex = state.contacts.indexOf(contact);
        contactsCopy[contactIndex] = newContact;
        return {...state, contacts : contactsCopy}
      } else {
        return state;
      }
      break;
    }
    default:
      return state;
  }
}

export default contactReducer;
