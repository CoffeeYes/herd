import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  NativeEventEmitter,
  AppState,
  Dimensions
} from 'react-native';

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

import {
  addNewReceivedMessages as addNewReceivedMessagesToRealm,
  removeCompletedMessagesFromRealm
} from './src/realm/chatRealm';
import { getAllContacts, getContactsByKey } from './src/realm/contactRealm';
import { getContactsWithChats, getMessageQueue } from './src/realm/chatRealm';

import { getPasswordHash } from './src/realm/passwordRealm';

import { setPublicKey, setPassword } from './src/redux/actions/userActions';
import { setContacts } from './src/redux/actions/contactActions';
import { setChats, setStyles, setMessageQueue, updateChat, removeMessagesFromQueue } from './src/redux/actions/chatActions';
import { setEnableNotifications, setLastRoutes, setMaxPasswordAttempts, setBackgroundServiceRunning } from './src/redux/actions/appStateActions';
import { getUniqueKeysFromMessages } from './src/realm/helper.js';

const Stack = createStackNavigator();

const App = ({ }) => {
  const dispatch = useDispatch();
  const [initialRoute, setInitialRoute] = useState("main");
  const [loading, setLoading] = useState(true);
  const ownPublicKey = useSelector(state => state.userReducer.publicKey);
  const passwordHash = useSelector(state => state.userReducer.loginPasswordHash);
  const lockable = useSelector(state => state.appStateReducer.lockable);
  const customStyle = useSelector(state => state.chatReducer.styles)
  const enableNotifications = useSelector(state => state.appStateReducer.sendNotificationForNewMessages);

  const passwordSetRef = useRef();
  const lockableRef = useRef();
  const customStyleRef = useRef(customStyle);

  const ownPublicKeyRef = useRef(ownPublicKey);
  const enableNotificationsRef = useRef(enableNotifications);
  const notificationIDRef = useRef();
  const notificationContactsRef = useRef([]);

  useEffect(() => {
    ownPublicKeyRef.current = ownPublicKey;
  },[ownPublicKey])

  useEffect(() => {
    enableNotificationsRef.current = enableNotifications
  },[enableNotifications])

  useEffect(() => {
    (async () => {
      await loadInitialState();
      const serviceRunning = await ServiceInterface.isRunning();
      dispatch(setBackgroundServiceRunning(serviceRunning));
      if(serviceRunning) {
        const newMessages = await ServiceInterface.getMessages("received");

        newMessages.length > 0 &&
        await addNewReceivedMessagesToRealm(newMessages,dispatch);
      }
      else {
        await loadStoredMessages();
        if(await ServiceInterface.isBound()) {
          ServiceInterface.unbindService();
        }
      }

      const maxPasswordAttempts = parseInt(await AsyncStorage.getItem("maxPasswordAttempts"));
      dispatch(setMaxPasswordAttempts(maxPasswordAttempts))
      setLoading(false);
    })()

    const eventEmitter = new NativeEventEmitter(ServiceInterface);
    const messagesListener = eventEmitter.addListener("newHerdMessagesReceived", async messages => {
      await addNewReceivedMessagesToRealm(messages,dispatch);
      const routes = navigationRef.current.getState().routes;
      const lastRoute = routes[routes.length - 1];
      const checkIfUserIsInChat = lastRoute.name == "chat";
      let notificationPending = false;
      if(notificationIDRef.current) {
        notificationPending = await ServiceInterface.notificationIsPending(notificationIDRef.current);
      }
      if(!notificationPending) {
        notificationContactsRef.current = [];
      }
      const uniqueKeys = getUniqueKeysFromMessages(
        messages.filter(message => message.to.trim() == ownPublicKeyRef.current.trim()),
        "from"
      )
      const contacts = getContactsByKey(uniqueKeys);
      let chatsWithNewMessages = JSON.parse(await AsyncStorage.getItem("chatsWithNewMessages")) || [];
      for(const contact of contacts) {
        //do not set "hasNewMessages" if user is already sitting in the chat with new messages
        const userInChat = checkIfUserIsInChat && lastRoute.params.contactID == contact._id;
        if(!userInChat && !notificationContactsRef.current.includes(contact.name)) {
          notificationContactsRef.current.push(contact.name);
        }
        dispatch(updateChat({...contact, doneLoading : false, hasNewMessages : !userInChat}));
        if(userInChat) {
          chatsWithNewMessages = chatsWithNewMessages.filter(chatID => chatID != contact._id);
        }
      }
      AsyncStorage.setItem("chatsWithNewMessages",JSON.stringify(chatsWithNewMessages));
      if(notificationContactsRef.current.length > 0 && enableNotificationsRef.current) {
        let notificationText = notificationContactsRef.current.slice(0,2).join(",");
        if (notificationContactsRef.current.length > 2) {
          notificationText += ` and ${notificationContactsRef.current.length - 2} more.`
        }
        if(notificationPending) {
          ServiceInterface.updateNotification("You have new messages",`from ${notificationText}`,notificationIDRef.current);
        }
        else {
          notificationIDRef.current = await ServiceInterface.sendNotification("You have new messages",`from ${notificationText}`);
        }
      }
    })

    const removeFromQueueListener = eventEmitter.addListener("removeMessagesFromQueue", messages => {
      dispatch(removeMessagesFromQueue(messages.map(message => message._id)));
    })

    const appStateListener = AppState.addEventListener("change",async state => {
      //switch to lock screen when backgrounded to prevent render from leaking
      //during transition when tabbing back in
      if(state === "background" && passwordSetRef.current && lockableRef.current) {
        const routes = navigationRef.current.getState().routes.filter(route => route.name != "passwordLockScreen");
        navigationRef.current.dispatch(
          CommonActions.reset({
            index: 1,
            routes: [...navigationRef.current.getState().routes, {name : "passwordLockScreen"}]
          })
        )
        routes &&
        dispatch(setLastRoutes(routes));
      }
    })

    const orientationListener = Dimensions.addEventListener("change", () => {

      const [scaledUIFontSize, scaledTitleSize, scaledSubTextSize] = calculateScaledFontSizes([
        customStyleRef.current.uiFontSize,
        customStyleRef.current.titleSize,
        customStyleRef.current.subTextSize
      ])

      dispatch(setStyles({
        scaledUIFontSize,
        scaledSubTextSize,
        scaledTitleSize
      }));
    })

    const bluetoothAndLocationStateListener = eventEmitter.addListener("bluetoothOrLocationStateChange", state => {
      if(state === "ADAPTER_TURNED_OFF" || state === "LOCATION_DISABLED") {
        dispatch(setBackgroundServiceRunning(false));
      }
    })

    ServiceInterface.setFrontendRunning(true);

    return () => {
      messagesListener.remove();
      removeFromQueueListener.remove();
      appStateListener.remove();
      orientationListener.remove();
      ServiceInterface.setFrontendRunning(false);
      bluetoothAndLocationStateListener.remove();
    }
  },[])

  useEffect(() => {
    passwordSetRef.current = passwordHash.length > 0;
  },[passwordHash])

  useEffect(() => {
    lockableRef.current = lockable;
  },[lockable])

  useEffect(() => {
    customStyleRef.current = customStyle;
    [scaledUIFontSize, scaledTitleSize, scaledSubTextSize, scaledMessageFontSize] = calculateScaledFontSizes([
      customStyle.uiFontSize,customStyle.titleSize,customStyle.subTextSize, customStyle.messageFontSize
    ])
    dispatch(setStyles({
      scaledUIFontSize,
      scaledTitleSize,
      scaledSubTextSize,
      scaledMessageFontSize
    }))
  },[customStyle.uiFontSize,customStyle.titleSize, customStyle.subTextSize, customStyle.messageFontSize])

  const calculateScaledFontSizes = (fontSizes = []) => {
    const addedWidth = Dimensions.get("window").width * 0.005;
    const scaledFonts = fontSizes.map(fontSize => Math.round(fontSize + addedWidth));
    return scaledFonts;
  }

  const loadInitialState = async () => {
    //get stored data
    const key = await Crypto.loadKeyFromKeystore("herdPersonal");
    const loginPassword = getPasswordHash("login");
    const erasurePassword = getPasswordHash("erasure");

    //determine the entry screen
    let initialRoute = "splash"
    if(key?.length > 0) {
      if(loginPassword.length > 0) {
        initialRoute = "passwordLockScreen";
      }
      else {
        initialRoute = "main";
      }
    }
    setInitialRoute(initialRoute)

    dispatch(setPublicKey(key));

    //load saved contacts into store)
    dispatch(setContacts(getAllContacts()))

    //load saved chats into store
    let contactsWithChats = (await getContactsWithChats())
    .sort( (a,b) => a.timestamp > b.timestamp);

    const chatsWithNewMessages = JSON.parse(await AsyncStorage.getItem("chatsWithNewMessages")) || [];
    for(let chat of contactsWithChats) {
      if (chatsWithNewMessages.includes(chat._id)) {
        chat.hasNewMessages = true;
      }
    }
    dispatch(setChats(contactsWithChats))

    //load styles into store
    let styles = JSON.parse(await AsyncStorage.getItem("styles"));
    if(styles) {
      const [scaledUIFontSize, scaledTitleSize, scaledSubTextSize] = calculateScaledFontSizes(
        [styles.uiFontSize,styles.titleSize,styles.subTextSize]
      )
      dispatch(setStyles({
        ...styles,
        scaledUIFontSize,
        scaledTitleSize,
        scaledSubTextSize
      }));
    }

    //load password hashes into store
    loginPassword.length > 0 &&
    dispatch(setPassword("login",loginPassword));

    erasurePassword.length > 0 &&
    dispatch(setPassword("erasure",erasurePassword));

    const messageQueue = await getMessageQueue(true);
    const sentMessageQueue = await getMessageQueue(false);
    dispatch(setMessageQueue(messageQueue.filter(message => sentMessageQueue.find(sentMessage => sentMessage._id == message._id) || message.to == key)))

    const enableNotifications = await AsyncStorage.getItem("enableNotifications");
    const notificationPermissionsGranted = await ServiceInterface.notificationsAreEnabled();
    dispatch(setEnableNotifications(enableNotifications === "true" && notificationPermissionsGranted));
  }

  const loadStoredMessages = async () => {
    const newMessages = await ServiceInterface.getStoredMessages(
      "savedMessageQueue",
      "savedMessageQueueSizes"
    )
    newMessages.length > 0 &&
    await addNewReceivedMessagesToRealm(newMessages,dispatch);

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
          <Stack.Screen
          name="passwordLockScreen"
          component={PasswordLockScreen}/>
          <Stack.Screen name="splash" component={Splash}/>
          <Stack.Screen name="main" component={Main}/>
          <Stack.Screen name="contacts" component={Contacts}/>
          <Stack.Screen name="contact" component={Contact}/>
          <Stack.Screen name="addContact" component={AddContact}/>
          <Stack.Screen name="editContact" component={EditContact}/>
          <Stack.Screen name="chats" component={Chats}/>
          <Stack.Screen name="chat" component={Chat}/>
          <Stack.Screen name="newChat" component={Contacts}/>
          <Stack.Screen name="BTDeviceList" component={BTDeviceList} />
          <Stack.Screen name="QRScanner" component={QRScanner}/>
          <Stack.Screen name="customise" component={Customise}/>
          <Stack.Screen name="messageQueue" component={MessageQueue}/>
          <Stack.Screen name="passwordSettings" component={PasswordSettings}/>
      </Stack.Navigator>}
    </>
  );
};

export default App;
