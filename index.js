import 'react-native-gesture-handler';
/**
 * @format
 */
import React, { useEffect } from 'react';
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import { NavigationContainer } from '@react-navigation/native';
import navigationRef from './src/NavigationRef';
import { closeChatRealm } from './src/realm/chatRealm';
import { closeContactRealm } from './src/realm/contactRealm';

const Index = () => {
  useEffect(() => {
    return () => {
      if(__DEV__) {
        closeChatRealm();
        closeContactRealm();
      }
    }
  },[])
  return (
    <NavigationContainer ref={navigationRef}>
      <App/>
    </NavigationContainer>
  )
}

AppRegistry.registerComponent(appName, () => Index);
