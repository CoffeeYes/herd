const initialState = {
  contacts : []
}

const contactReducer = (state = initialState,action) => {
  switch(action.type) {
    case "SET_CONTACTS":
      return {...state, contacts : action.payload}
    case "ADD_CONTACT":
      return {...state, contacts : [...state.contacts,action.payload]};
    case "DELETE_CONTACTS":
      let newContacts = [...state.contacts];
      if(action.payload[0]?._id) {
        newContacts = newContacts.filter(
          contact => action.payload.find(
            contactToDelete => contactToDelete._id == contact._id) === undefined
        )
      }
      else {
        newContacts = newContacts.filter(contact => !action.payload.includes(contact._id))
      }
      return {
        ...state,
        contacts : newContacts
      }
    case "UPDATE_CONTACT": {
      const { _id, ...payload} = action.payload;

      for(const key of Object.keys(payload)) {
        if(!["name","key","image"].includes(key)){
          delete payload[key];
        }
      }

      let contact = state.contacts.find(contact => contact._id == _id);
      if(contact) {
          let contactsCopy = [...state.contacts];
    	  let newContact  = {
            ...contact,
            ...payload
    	  };
        const contactIndex = state.contacts.indexOf(contact);
        contactsCopy[contactIndex] = newContact;
        return {...state, contacts : contactsCopy}
      } else {
        return state;
      }
    }
    default:
      return state;
  }
}

export default contactReducer;
