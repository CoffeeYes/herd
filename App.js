import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
  Button,
  NativeEventEmitter,
  AppState
} from 'react-native';

import {
  Header,
  LearnMoreLinks,
  Colors,
  DebugInstructions,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';
import { createStackNavigator } from '@react-navigation/stack';
import { CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import navigationRef from './src/NavigationRef.js'
import Crypto from './src/nativeWrapper/Crypto.js';
import ServiceInterface from './src/nativeWrapper/ServiceInterface.js'

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
import Customise from './src/views/Customise';
import MessageQueue from './src/views/MessageQueue';
import PasswordSettings from './src/views/PasswordSettings';
import PasswordLockScreen from './src/views/PasswordLockScreen';
import LoadingScreen from './src/views/LoadingScreen';
import LockedScreen from './src/views/LockedScreen';

import {
  addNewReceivedMessages as addNewReceivedMessagesToRealm,
  removeCompletedMessagesFromRealm
} from './src/realm/chatRealm';
import { getAllContacts } from './src/realm/contactRealm';
import { getContactsWithChats } from './src/realm/chatRealm';

import { getPasswordHash } from './src/realm/passwordRealm';

import { setPublicKey, setPassword } from './src/redux/actions/userActions';
import { setContacts } from './src/redux/actions/contactActions';
import { setChats, setStyles } from './src/redux/actions/chatActions';
import { setLocked } from './src/redux/actions/appStateActions';

const Stack = createStackNavigator()

const App = ({ }) => {
  const dispatch = useDispatch();
  const [initialRoute, setInitialRoute] = useState("main");
  const [loading, setLoading] = useState(true);
  const [previousAppState, setPreviousAppState] = useState(true);
  const publicKey = useSelector(state => state.userReducer.publicKey);
  const passwordHash = useSelector(state => state.userReducer.loginPasswordHash);
  const locked = useSelector(state => state.appStateReducer.locked);

  const passwordSetRef = useRef();

  useEffect(() => {
    (async () => {

      let newMessages = []
      if(await ServiceInterface.isRunning()) {
        newMessages = await ServiceInterface.getReceivedMessages();

        newMessages.length > 0 &&
        addNewReceivedMessagesToRealm(newMessages);
      }
      else {
        loadStoredMessages();
      }
      await loadInitialState();
      setLoading(false);
    })()

    const eventEmitter = new NativeEventEmitter(ServiceInterface);
    const messagesListener = eventEmitter.addListener("newHerdMessagesReceived", messages => {
      addNewReceivedMessagesToRealm(messages);
      dispatch(setChats(loadContactsWithChats()))
    })

    const appStateListener = AppState.addEventListener("change",async state => {
      //switch to lock screen when backgrounded to prevent render from leaking
      //during transition when tabbing back in
      if(state === "background" && passwordSetRef.current) {
        dispatch(setLocked(true))
      }
    })

    return () => {
      messagesListener.remove();
      appStateListener.remove();
    }
  },[])

  useEffect(() => {
    passwordSetRef.current = passwordHash.length > 0;
  },[passwordHash])

  const loadInitialState = async () => {
    //get stored data
    const key = await Crypto.loadKeyFromKeystore("herdPersonal");
    const loginPassword = getPasswordHash("loginPassword");
    const erasurePassword = getPasswordHash("erasurePassword");

    //determine the entry screen
    if(key?.length > 0) {
      setInitialRoute("main")
    }
    else {
      setInitialRoute("splash")
    }

    if(loginPassword.length > 0) {
      console.log(loginPassword)
      dispatch(setLocked(true));
    }

    dispatch(setPublicKey(key));

    //load saved contacts into store)
    dispatch(setContacts(getAllContacts()))

    //load saved chats into store
    var contactsWithChats = (await getContactsWithChats())
    .sort( (a,b) => a.timestamp > b.timestamp);
    dispatch(setChats(contactsWithChats))

    //load styles into store
    const styles = JSON.parse(await AsyncStorage.getItem("styles"));
    dispatch(setStyles(styles));

    //load password hashes into store
    loginPassword.length > 0 &&
    dispatch(setPassword("login",loginPassword));

    erasurePassword.length > 0 &&
    dispatch(setPassword("erasure",erasurePassword));
  }

  const loadStoredMessages = async () => {
    const newMessages = await ServiceInterface.getStoredMessages(
      "savedMessageQueue",
      "savedMessageQueueSizes"
    )

    newMessages.length > 0 &&
    addNewReceivedMessagesToRealm(newMessages);

    const messagesToRemove = await ServiceInterface.getStoredMessages(
      "messagesToRemove",
      "messagesToRemoveSizes"
    )

    messagesToRemove.length > 0 &&
    removeCompletedMessagesFromRealm(messagesToRemove);
  }

  return (
    <>
      {loading ?
      <LoadingScreen/>
      :
      <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{headerShown : false}}>
      {locked ?
        <Stack.Screen
        name="passwordLockScreen"
        component={PasswordLockScreen}/>
        :
        <>
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
          <Stack.Screen name="customise" component={Customise}/>
          <Stack.Screen name="messageQueue" component={MessageQueue}/>
          <Stack.Screen name="passwordSettings" component={PasswordSettings}/>
          <Stack.Screen
          name="passwordLockScreen2"
          component={PasswordLockScreen}/>
        </>}
      </Stack.Navigator>}
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
