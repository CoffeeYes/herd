
const addContact = contact => {
  return {
    action : "ADD_CONTACT",
    payload : contact
  }
}

const setContacts = contacts => {
  return {
    action : "SET_CONTACTS",
    payload : contacts
  }
}

export {
  setContacts
}
