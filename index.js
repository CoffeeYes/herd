import 'react-native-gesture-handler';
import 'react-native-get-random-values';
/**
 * @format
 */
import React, { useEffect } from 'react';
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import { NavigationContainer } from '@react-navigation/native';
import navigationRef from './src/NavigationRef';

import store from './src/redux/store';
import { Provider } from 'react-redux'

const Index = () => {
  return (
    <Provider store={store}>
      <NavigationContainer ref={navigationRef}>
        <App/>
      </NavigationContainer>
    </Provider>
  )
}

AppRegistry.registerComponent(appName, () => Index);
