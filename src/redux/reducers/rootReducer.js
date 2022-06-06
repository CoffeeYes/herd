import { combineReducers } from 'redux';

import chatReducer from './chatReducer';
import userReducer from './userReducer';
import contactReducer from './contactReducer';
import appStateReducer from './appStateReducer';

const rootReducer = combineReducers({
  chatReducer,
  contactReducer,
  userReducer,
  appStateReducer
})

export default rootReducer;
