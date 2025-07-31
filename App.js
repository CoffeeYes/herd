import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  NativeEventEmitter,
  AppState,
  Dimensions,
  SafeAreaView
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
  openChatRealm,
  removeCompletedMessagesFromRealm
} from './src/realm/chatRealm';
import { getAllContacts, getContactsByKey, openContactRealm } from './src/realm/contactRealm';
import { getContactsWithChats, getMessageQueue } from './src/realm/chatRealm';

import { getPasswordHash, openPasswordRealm } from './src/realm/passwordRealm';

import { setPublicKey, setPassword } from './src/redux/actions/userActions';
import { setContacts } from './src/redux/actions/contactActions';
import { setChats, setMessageQueue, removeMessagesFromQueue } from './src/redux/actions/chatActions';
import { setEnableNotifications, setLastRoutes, setMaxPasswordAttempts, setBackgroundServiceRunning, setStyles } from './src/redux/actions/appStateActions';
import { getUniqueKeysFromMessages } from './src/helper.js';
import { loadChatsWithNewMessages, STORAGE_STRINGS } from './src/common.js';

const Stack = createStackNavigator();

const App = ({ }) => {
  const dispatch = useDispatch();
  const [initialRoute, setInitialRoute] = useState("main");
  const [loading, setLoading] = useState(true);
  const ownPublicKey = useSelector(state => state.userReducer.publicKey);
  const passwordHash = useSelector(state => state.userReducer.loginPasswordHash);
  const lockable = useSelector(state => state.appStateReducer.lockable);
  const customStyle = useSelector(state => state.appStateReducer.styles)
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
      await openChatRealm();
      await openContactRealm();
      await openPasswordRealm();
      await loadInitialState();
      const serviceRunning = await ServiceInterface.isRunning();
      dispatch(setBackgroundServiceRunning(serviceRunning));
      if(serviceRunning) {
        const newMessages = await ServiceInterface.getMessages(ServiceInterface.messageTypes.RECEIVED_MESSAGES);

        newMessages.length > 0 &&
        await addNewReceivedMessagesToRealm(newMessages,dispatch);
        
        const messagesToRemove = await ServiceInterface.getMessages(ServiceInterface.messageTypes.COMPLETED_MESSAGES);
        removeCompletedMessagesFromRealm(messagesToRemove);
      }
      else {
        await loadStoredMessages();
        if(await ServiceInterface.isBound()) {
          ServiceInterface.unbindService();
        }
      }

      const maxPasswordAttempts = parseInt(await AsyncStorage.getItem(STORAGE_STRINGS.MAX_PASSWORD_ATTEMPTS));
      dispatch(setMaxPasswordAttempts(maxPasswordAttempts))
      setLoading(false);
    })()

    const eventEmitter = new NativeEventEmitter(ServiceInterface);
    const messagesListener = eventEmitter.addListener(ServiceInterface.emitterStrings.NEW_MESSAGES_RECEIVED, async messages => {
      const routes = navigationRef.current.getState().routes;
      const lastRoute = routes[routes.length - 1];
      const isInChat = lastRoute.name == "chat";
      const currentChat = lastRoute?.params?.contactID; 
      await addNewReceivedMessagesToRealm(messages, dispatch, currentChat);
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
      let contacts = getContactsByKey(uniqueKeys);
      if(isInChat) {
        contacts = contacts.filter(contact => contact._id != currentChat);
      }
      for(const contact of contacts) {
        if(!notificationContactsRef.current.find(existingContact => existingContact._id == contact._id)) {
          notificationContactsRef.current.push({_id : contact._id, name : contact.name});
        }
      }
      if(notificationContactsRef.current.length > 0 && enableNotificationsRef.current) {
        const notificationNames = notificationContactsRef.current.map(contact => contact.name);
        let notificationText = notificationNames.slice(0,2).join(",");
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

    const removeFromQueueListener = eventEmitter.addListener(ServiceInterface.emitterStrings.REMOVE_MESSAGES_FROM_QUEUE, messages => {
      dispatch(removeMessagesFromQueue(messages.map(message => message._id)));
      removeCompletedMessagesFromRealm(messages);
    })

    const appStateListener = AppState.addEventListener("change",async state => {
      //switch to lock screen when backgrounded to prevent render from leaking
      //during transition when tabbing back in
      if(state === "background" && passwordSetRef.current && lockableRef.current) {
        const routes = navigationRef.current.getState().routes.filter(route => route.name != "passwordLockScreen");
        navigationRef.current.dispatch(
          CommonActions.reset({
            index: routes.length,
            routes: [...routes, {name : "passwordLockScreen"}]
          })
        )
        routes &&
        dispatch(setLastRoutes(routes));
      }
    })

    const orientationListener = Dimensions.addEventListener("change", () => {
      updateScaledFonts(customStyleRef.current);
    })

    const bluetoothAndLocationStateListener = eventEmitter.addListener(ServiceInterface.emitterStrings.BLUETOOTH_LOCATION_STATE_CHANGE, state => {
      if(state === ServiceInterface.bluetoothErrors.ADAPTER_TURNED_OFF || 
        state === ServiceInterface.bluetoothErrors.LOCATION_DISABLED) {
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
    updateScaledFonts(customStyle);
  },[customStyle.uiFontSize,customStyle.titleSize, customStyle.subTextSize, customStyle.messageFontSize])

  const calculateScaledFontSizes = (fontSizes = []) => {
    const addedWidth = Dimensions.get("window").width * 0.005;
    const scaledFonts = fontSizes.map(fontSize => Math.round(fontSize + addedWidth));
    return scaledFonts;
  }

  const updateScaledFonts = customStyle => {
    [scaledUIFontSize, scaledTitleSize, scaledSubTextSize, scaledMessageFontSize] = calculateScaledFontSizes([
      customStyle.uiFontSize,customStyle.titleSize,customStyle.subTextSize, customStyle.messageFontSize
    ])
    dispatch(setStyles({
      scaledUIFontSize,
      scaledTitleSize,
      scaledSubTextSize,
      scaledMessageFontSize
    }))
  }

  const loadInitialState = async () => {
    //get stored data
    const key = await Crypto.loadKeyFromKeystore("herdPersonal");
    const loginPassword = getPasswordHash("login");
    const erasurePassword = getPasswordHash("erasure");

    const setupComplete = JSON.parse(await AsyncStorage.getItem(STORAGE_STRINGS.SETUP_COMPLETE))

    //determine the entry screen
    let initialRoute = "splash"
    if(setupComplete) {
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
    .sort( (a,b) => a.timestamp - b.timestamp);

    contactsWithChats = await loadChatsWithNewMessages(contactsWithChats);
    dispatch(setChats(contactsWithChats))

    //load styles into store
    let styles = JSON.parse(await AsyncStorage.getItem(STORAGE_STRINGS.STYLES));
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
    dispatch(setMessageQueue(messageQueue.filter(message => sentMessageQueue.find(sentMessage => sentMessage._id == message._id))))

    const enableNotifications = await AsyncStorage.getItem(STORAGE_STRINGS.ENABLE_NOTIFICATIONS);
    const notificationPermissionsGranted = await ServiceInterface.notificationsAreEnabled();
    dispatch(setEnableNotifications(enableNotifications === "true" && notificationPermissionsGranted));
  }

  const loadStoredMessages = async () => {
    const newMessages = await ServiceInterface.getStoredMessages(
      ServiceInterface.storage.SAVED_MESSAGE_QUEUE,
      ServiceInterface.storage.SAVED_MESSAGE_QUEUE_SIZES
    )
    newMessages.length > 0 &&
    await addNewReceivedMessagesToRealm(newMessages,dispatch);

    const messagesToRemove = await ServiceInterface.getStoredMessages(
      ServiceInterface.storage.MESSAGES_TO_REMOVE,
      ServiceInterface.storage.MESSAGES_TO_REMOVE_SIZES
    )

    messagesToRemove.length > 0 &&
    removeCompletedMessagesFromRealm(messagesToRemove);
  }

  const PrimaryWrapper = useCallback(({children}) => {
    return (
      Platform.OS === "ios" ?
      <SafeAreaView style={{flex : 1}}>
        {children}
      </SafeAreaView>
      :
      <>
      {children}
      </>
    )
  },[])

  return (
    <PrimaryWrapper>
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
    </PrimaryWrapper>
  );
};

export default App;
