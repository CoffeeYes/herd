/**
 * @format
 */

import 'react-native';
import React from 'react';
import App from '../App';
import Realm from 'realm';

import store from '../src/redux/store';
import { Provider } from 'react-redux'
import { closeChatRealm, deleteChatRealm, openChatRealm } from '../src/realm/chatRealm';
import { closeContactRealm, deleteContactRealm, openContactRealm } from '../src/realm/contactRealm';
import { closePasswordRealm, deletePasswordRealm, openPasswordRealm } from '../src/realm/passwordRealm';

// Note: test renderer must be required after react-native.
import renderer from 'react-test-renderer';

beforeAll(async () => {
  await openContactRealm();
  await openChatRealm();
  await openPasswordRealm();
})

it('renders correctly', () => {
  renderer.create(
    <Provider store={store}>
      <App />
    </Provider>
  );
});

afterAll(done => {
  closeChatRealm();
  closeContactRealm();
  closePasswordRealm();
  deleteChatRealm();
  deleteContactRealm();
  deletePasswordRealm();
  Realm.clearTestState();
  done();
})
