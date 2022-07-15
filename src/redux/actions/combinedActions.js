import { setContacts } from './contactActions';
import { setMessageQueue, setChats } from './chatActions';
import { setLocked } from './appStateActions';

const eraseState = dispatch => {
  dispatch(setContacts([]));
  dispatch(setChats([]));
  dispatch(setMessageQueue([]));
  dispatch(setLocked(false));
}

export {
  eraseState
}
