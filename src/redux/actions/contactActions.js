
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

export {
  addContact,
  setContacts
}
