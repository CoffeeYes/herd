import { setContacts, updateContact } from './contactActions';
import { setMessageQueue, setChats, updateChat } from './chatActions';
import { setLocked } from './appStateActions';

const eraseState = dispatch => {
  dispatch(setContacts([]));
  dispatch(setChats([]));
  dispatch(setMessageQueue([]));
  dispatch(setLocked(false));
}

const updateContactAndReferences = (dispatch,contact) => {
  dispatch(updateContact(contact));
  dispatch(updateChat(contact));
}

export {
  eraseState,
  updateContactAndReferences
}
