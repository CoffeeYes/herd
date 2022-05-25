import { combineReducers } from 'redux';

import chatReducer from './chatReducer';
import userReducer from './userReducer';
import contactReducer from './contactReducer';

const rootReducer = combineReducers({
  chatReducer,
  contactReducer,
  userReducer
})

export default rootReducer;
