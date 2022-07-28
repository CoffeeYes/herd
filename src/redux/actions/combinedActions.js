import { setContacts, updateContact } from './contactActions';
import { setMessageQueue, setChats, updateChatName } from './chatActions';
import { setLocked } from './appStateActions';

const eraseState = dispatch => {
  dispatch(setContacts([]));
  dispatch(setChats([]));
  dispatch(setMessageQueue([]));
  dispatch(setLocked(false));
}

const updateContactAndReferences = (dispatch,contact) => {
  dispatch(updateContact(contact));
  dispatch(updateChatName(contact));
}

export {
  eraseState,
  updateContactAndReferences
}
