import { combineReducers } from 'redux';

import chatReducer from './chatReducer';
import userReducer from './userReducer';

const rootReducer = combineReducers({
  chatReducer,
  userReducer
})

export default rootReducer;
