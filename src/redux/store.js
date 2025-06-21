import { configureStore } from '@reduxjs/toolkit';
import thunkMiddleware from 'redux-thunk';
import userReducer from './reducers/userReducer';
import appStateReducer from './reducers/appStateReducer';
import chatReducer from './reducers/chatReducer';
import contactReducer from './reducers/contactReducer';

const store = configureStore({
  reducer : {
    userReducer,
    appStateReducer,
    chatReducer,
    contactReducer
  },
  middleware : [thunkMiddleware] 
})

export default store;
