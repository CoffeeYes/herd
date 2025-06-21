import Schemas from "../../realm/Schemas";

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
      let contactIDs = action.payload;
      if(action.payload[0]?._id) {
        contactIDs = action.payload.map(contact => contact._id);
      }
      const newContacts = [...state.contacts].filter(contact => !contactIDs.includes(contact._id))
      return {
        ...state,
        contacts : newContacts
      }
    case "UPDATE_CONTACT": {
      const { _id, ...payload} = action.payload;

      for(const key of Object.keys(payload)) {
        if(!Object.keys(Schemas.ContactSchema.properties).includes(key)){
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
