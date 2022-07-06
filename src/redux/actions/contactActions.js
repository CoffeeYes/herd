import { resetMessages } from './chatActions';

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

const deleteContact = contact => {
  return {
    type : "DELETE_CONTACT",
    payload : contact
  }
}

const updateContact = contact => {
  return {
    type : "UPDATE_CONTACT",
    payload : contact
  }
}

const resetContacts = (dispatch) => {
  dispatch({
    type : "SET_CONTACTS",
    payload : []
  });
  dispatch(resetMessages());
}

export {
  addContact,
  deleteContact,
  updateContact,
  setContacts,
  resetContacts
}
