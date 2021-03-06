import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
  Button
} from 'react-native';

import {
  Header,
  LearnMoreLinks,
  Colors,
  DebugInstructions,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';
import { createStackNavigator } from '@react-navigation/stack';
import navigationRef from './src/NavigationRef.js'
import AsyncStorage from '@react-native-async-storage/async-storage';
import Crypto from './src/nativeWrapper/Crypto.js'

import Chats from './src/views/Chats';
import Chat from './src/views/Chat';
import Contacts from './src/views/Contacts';
import Contact from './src/views/Contact';
import AddContact from './src/views/AddContact';
import CreateContact from './src/views/CreateContact';
import Splash from './src/views/Splash';
import Main from './src/views/Main';
import BTDeviceList from './src/views/BTDeviceList';
import QRScanner from './src/views/QRScanner';
import EditContact from './src/views/EditContact';

const Stack = createStackNavigator()

const App = ({ }) => {

  useEffect(() => {
    loadOwnKey()
  },[])

  const loadOwnKey = async () => {
    const key = await Crypto.loadKeyFromKeystore("herdPersonal")
    if(!key) {
      navigationRef.current.navigate("splash")
    }
  }

  return (
    <>
          <Stack.Navigator
          initialRouteName="main"
          screenOptions={{headerShown : false}}>
            <Stack.Screen name="contacts" component={Contacts}/>
            <Stack.Screen name="addContact" component={AddContact}/>
            <Stack.Screen name="chats" component={Chats}/>
            <Stack.Screen name="splash" component={Splash}/>
            <Stack.Screen name="main" component={Main}/>
            <Stack.Screen name="chat" component={Chat}/>
            <Stack.Screen name="contact" component={Contact}/>
            <Stack.Screen name="createcontact" component={CreateContact}/>
            <Stack.Screen name="newChat" component={Contacts}/>
            <Stack.Screen name="BTDeviceList" component={BTDeviceList} />
            <Stack.Screen name="QRScanner" component={QRScanner}/>
            <Stack.Screen name="editContact" component={EditContact}/>
          </Stack.Navigator>
    </>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: Colors.lighter,
  },
  engine: {
    position: 'absolute',
    right: 0,
  },
  body: {
    backgroundColor: Colors.white,
  },
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.black,
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
    color: Colors.dark,
  },
  highlight: {
    fontWeight: '700',
  },
  footer: {
    color: Colors.dark,
    fontSize: 12,
    fontWeight: '600',
    padding: 4,
    paddingRight: 12,
    textAlign: 'right',
  },
});

export default App;
