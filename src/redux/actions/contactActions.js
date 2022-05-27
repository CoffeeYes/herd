
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

export {
  addContact,
  deleteContact,
  setContacts
}
