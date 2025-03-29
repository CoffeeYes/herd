/**
 * @format
 */

import 'react-native';
import React from 'react';
import App from '../App';

import store from '../src/redux/store';
import { Provider } from 'react-redux'

// Note: test renderer must be required after react-native.
import renderer from 'react-test-renderer';

jest.mock('react-native-vector-Icons/MaterialIcons', () => 'Icon');
jest.mock('react-native-qrcode-svg', () => 'QRCODE');
jest.mock('react-native-qrcode-scanner', () => 'QRCODE_SCANNER');
jest.mock('react-native-image-picker', () => 'IMAGE_PICKER');

it('renders correctly', () => {
  renderer.create(
    <Provider store={store}>
      <App />
    </Provider>
  );
});
