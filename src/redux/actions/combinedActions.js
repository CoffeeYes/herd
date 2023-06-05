import { setContacts, updateContact } from './contactActions';
import { setMessageQueue, setChats, updateChat } from './chatActions';
import { setLocked } from './appStateActions';

const eraseState = () => {
  return (dispatch,getState) => {
    dispatch(setContacts([]));
    dispatch(setChats([]));
    dispatch(setMessageQueue([]));
    dispatch(setLocked(false));
  }
}

const updateContactAndReferences = contact => {
  return (dispatch,getState) => {
    dispatch(updateContact(contact));
    dispatch(updateChat(contact));
  }
}

export {
  eraseState,
  updateContactAndReferences
}
