import { resetMessages, deleteChat } from './chatActions';

const addContact = contact => {
  return {
    type : "ADD_CONTACT",
    payload : contact
  }
}

const setContacts = contacts => {
  return {
    type : "SET_CONTACTS",
    payload : contacts
  }
}

const deleteContacts = contacts => {
  return (dispatch,getState) => {
    for (const contact of contacts) {
      dispatch(deleteChat(contact))
    }
    dispatch({type : "DELETE_CONTACTS",payload : contacts})
  }
}

const updateContact = contact => {
  return {
    type : "UPDATE_CONTACT",
    payload : contact
  }
}

const resetContacts = () => {
  return (dispatch,getState) => {
    dispatch({type : "SET_CONTACTS",payload : []})
    dispatch(resetMessages());
  }
}

export {
  addContact,
  deleteContacts,
  updateContact,
  setContacts,
  resetContacts
}
