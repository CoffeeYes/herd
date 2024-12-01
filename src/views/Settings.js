import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { Text, ScrollView,
         View, Switch, Alert, 
         NativeEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Clipboard from '@react-native-clipboard/clipboard';
import ServiceInterface from '../nativeWrapper/ServiceInterface';
import QRCodeModal from './QRCodeModal';
import Header from './Header';
import CustomButton from './CustomButton';
import CardButton from './CardButton';
import PermissionModal from './PermissionModal';

import PermissionManager from '../nativeWrapper/PermissionManager';

import { closeChatRealm } from '../realm/chatRealm';
import { closeContactRealm } from '../realm/contactRealm';
import { closePasswordRealm } from '../realm/passwordRealm';
import { parseRealmID } from '../realm/helper';

import { setMessageQueue, deleteChats } from '../redux/actions/chatActions';
import { resetContacts } from '../redux/actions/contactActions';
import { setBackgroundServiceRunning, setEnableNotifications, setLockable } from '../redux/actions/appStateActions';

import { palette } from '../assets/palette';

import { useScreenAdjustedSize } from '../helper';

import {
  getMessageQueue,
  getDeletedReceivedMessages,
  getReceivedMessagesForSelf,
  deleteAllMessages as deleteAllMessagesFromRealm,
  deleteAllChats as deleteAllChatsFromRealm } from '../realm/chatRealm';
import { deleteAllContacts as deleteAllContactsFromRealm} from '../realm/contactRealm'
import { requestEnableBluetooth, requestEnableLocation, requestPermissionsForBluetooth } from '../common';

const Settings = ({ navigation }) => {
  const dispatch = useDispatch();
  const customStyle = useSelector(state => state.chatReducer.styles);
  const [QRCodeVisible, setQRCodeVisible] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [requestedPermissions, setRequestedPermissions] = useState([]);

  const publicKey = useSelector(state => state.userReducer.publicKey);
  const userHasPassword = useSelector(state => state.userReducer.loginPasswordHash).length > 0;
  const enableNotifications = useSelector(state => state.appStateReducer.sendNotificationForNewMessages);
  const backgroundServiceRunning = useSelector(state => state.appStateReducer.backgroundServiceRunning)

  const cardIconSize = useScreenAdjustedSize(0.075,0.05) + (customStyle.scaledUIFontSize*0.2);
  
  const alreadyNavigating = useRef(false);

  useEffect(() => {
    const eventEmitter = new NativeEventEmitter(ServiceInterface);

    const bluetoothAndLocationStateListener = eventEmitter.addListener("bluetoothOrLocationStateChange", state => {
      if(state === "ADAPTER_TURNED_OFF" || state === "LOCATION_DISABLED") {
        dispatch(setBackgroundServiceRunning(false));
      }
    })

    return () => bluetoothAndLocationStateListener.remove();
  },[]);

  const copyKeyToClipboard = async () => {
    Clipboard.setString(publicKey);
    return true;
  }

  const showDeletionAlert = async (text, onConfirm = async () => {}, onCancel = async () => {}) => {
    Alert.alert(
      text,
      '',
      [
        { text: "Cancel", style: 'cancel', onPress: async () => await onCancel() },
        {
          text: 'Delete',
          style: 'destructive',
          // If the user confirmed, then we dispatch the action we blocked earlier
          // This will continue the action that had triggered the removal of the screen
          onPress: async () => await onConfirm(),
        },
      ]
    );
  }

  const toggleBackgroundTransfer = async value => {
    if(value) {
      dispatch(setLockable(false));

      setRequestedPermissions([]);

      const missingPermissions = await requestPermissionsForBluetooth();

      if(missingPermissions.length > 0) {
        setRequestedPermissions(missingPermissions);
        setShowPermissionModal(true);
        dispatch(setLockable(true));
        return;
      }

      const btEnabled = await requestEnableBluetooth();
      if(!btEnabled) {
        dispatch(setLockable(true));
        return;
      }

      const locationEnabled = await requestEnableLocation();
      if(!locationEnabled) {
        dispatch(setLockable(true));
        return;
      }

      if(btEnabled && locationEnabled) {
        dispatch(setBackgroundServiceRunning(true));
        const messageQueue = (await getMessageQueue(false)).map(msg => ({...msg,_id : parseRealmID(msg)}));
        const deletedReceivedMessages = getDeletedReceivedMessages().map(msg => ({...msg,_id : parseRealmID(msg)}));
        const receivedMessagesForSelf = await getReceivedMessagesForSelf();
        ServiceInterface.enableService(
          messageQueue,
          receivedMessagesForSelf,
          deletedReceivedMessages,
          publicKey.trim()
        );
      }
    }
    else {
      dispatch(setBackgroundServiceRunning(false));
      if(backgroundServiceRunning) {
        ServiceInterface.disableService();
      }
    }
    dispatch(setLockable(true))
  }

  const closeRealms = () => {
    closeChatRealm();
    closeContactRealm();
    closePasswordRealm();
  }

  useFocusEffect(() => {
    alreadyNavigating.current = false;
  })

  const navigate = (route, params) => {
    if(!alreadyNavigating.current && !QRCodeVisible) {
      alreadyNavigating.current = true;
      navigation.navigate(route,params);
    }
  }

  const toggleNotifications = async enable => {
    if(enable) {
      let nativeNotificationsEnabled = await ServiceInterface.notificationsAreEnabled();
      if(!nativeNotificationsEnabled) {
        dispatch(setLockable(false))
        nativeNotificationsEnabled = await PermissionManager.requestNotificationPermissions();
      }
      if(!nativeNotificationsEnabled) {
        setShowPermissionModal(true);
        setRequestedPermissions(["Notifications"]);
        dispatch(setLockable(true));
        return;
      }
      const enableNotifications = enable && nativeNotificationsEnabled;
      dispatch(setEnableNotifications(enableNotifications))
      await AsyncStorage.setItem("enableNotifications",enableNotifications.toString())
      dispatch(setLockable(true))
    }
    else {
      dispatch(setEnableNotifications(false));
      await AsyncStorage.setItem("enableNotifications",false.toString())
    }
  }

  const locationModalDescription = `In order to transfer messages in the background, herd requires \
certain permissions to be allowed all the time.`

  const locationModalInstructionText = `Please go into the permission settings for Herd and select 'Allow all the time' \
for the following permissions in order to allow Herd to function correctly.`

  const notificationModalDescription = `In order to send you notifications when new messages are received, Herd requires \
certain permissions to be allowed all the time`

  return (
    <>
      <Header title="Settings"/>

      <ScrollView contentContainerStyle={{alignItems : "center", paddingBottom : 10}}>

        <View style={styles.card}>

          {!backgroundServiceRunning &&
          <Text style={{...styles.warning, fontSize : customStyle.scaledUIFontSize}}>
          WARNING : if you disable background transfers your messages
          will not be transmitted
          </Text>}

          <View style={{flexDirection : "row", marginVertical: 10}}>
            <Text style={{fontWeight : "bold", fontSize : customStyle.scaledUIFontSize}}>Background Transfers</Text>
            <Switch
            style={{marginLeft : 10}}
            onValueChange={val => toggleBackgroundTransfer(val)}
            disabled={QRCodeVisible}
            value={backgroundServiceRunning}
            trackColor={{ false: palette.grey, true: palette.primary }}
            thumbColor={backgroundServiceRunning ? palette.secondary : palette.lightgrey}
            ios_backgroundColor={palette.primary}/>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={{fontWeight : "bold", fontSize : customStyle.scaledUIFontSize}}> Send me a notification when new messages are received</Text>
          <Switch
          style={{marginTop: 10}}
          onValueChange={async val => toggleNotifications(val)}
          disabled={QRCodeVisible}
          value={enableNotifications}
          trackColor={{ false: palette.grey, true: palette.primary }}
          thumbColor={enableNotifications ? palette.secondary : palette.lightgrey}
          ios_backgroundColor={palette.primary}/>
        </View>

        <CardButton
        text="Copy Your Key"
        flashText="Copied!"
        timeout={500}
        rightIcon="content-copy"
        iconSize={cardIconSize}
        onPress={() => !alreadyNavigating.current && copyKeyToClipboard()}/>

        <CardButton
        text="Show My QR Code"
        rightIcon="qr-code-2"
        iconSize={cardIconSize}
        onPress={() => !alreadyNavigating.current && !showPermissionModal && setQRCodeVisible(true)}/>

        <CardButton
        text="Customise"
        rightIcon="edit"
        iconSize={cardIconSize}
        onPress={() => navigate("customise")}/>

        <CardButton
        text="Message Queue"
        rightIcon="message"
        iconSize={cardIconSize}
        onPress={() => navigate("messageQueue")}/>

        <CardButton
        text="Password Protection"
        rightIcon="lock"
        iconSize={cardIconSize}
        onPress={() => userHasPassword ?
          navigate("passwordLockScreen",{navigationTarget : "passwordSettings"})
          :
          navigate("passwordSettings")}
        />

        <CardButton
        text="Delete All Chats"
        textStyle={styles.deleteCardTextStyle}
        iconStyle={styles.deleteCardIconStyle}
        rightIcon="delete"
        iconSize={cardIconSize}
        onPress={() => showDeletionAlert(
          "Are you sure you want to delete all chats?",
          () => {
            deleteAllChatsFromRealm();
            dispatch(deleteChats("all"));
          }
        )}/>

        <CardButton
        text="Delete All Contacts"
        textStyle={styles.deleteCardTextStyle}
        iconStyle={styles.deleteCardIconStyle}
        rightIcon="delete"
        iconSize={cardIconSize}
        onPress={() => showDeletionAlert(
          "Are you sure you want to delete all contacts?",
          () => {
            deleteAllContactsFromRealm();
            deleteAllChatsFromRealm();
            dispatch(deleteChats("all"))
            dispatch(resetContacts());
          }
        )}/>

        <CardButton
        text="Delete All Messages"
        textStyle={styles.deleteCardTextStyle}
        iconStyle={styles.deleteCardIconStyle}
        rightIcon="delete-forever"
        iconSize={cardIconSize}
        onPress={() => showDeletionAlert(
          "Are you sure you want to delete all messages?",
          () => {
            deleteAllMessagesFromRealm();
            dispatch(deleteChats("all"));
            dispatch(setMessageQueue([]));
          }
        )}/>

        {__DEV__ &&
          <CustomButton
          buttonStyle={{backgroundColor : palette.red,...styles.buttonMargin}}
          onPress={closeRealms}
          text="Close Realm"/>
        }

        <QRCodeModal
        visible={QRCodeVisible}
        value={{key : publicKey}}
        title="My Key"
        onPress={() => setQRCodeVisible(false)}
        onRequestClose={() => setQRCodeVisible(false)}/>

        <PermissionModal
        icon={requestedPermissions.length == 1 && requestedPermissions[0] == "Notifications" ? "notifications-active" : "location-on"}
        visible={showPermissionModal}
        permissions={requestedPermissions}
        onRequestClose={() => {
          setRequestedPermissions([]);
          setShowPermissionModal(false)
        }}
        buttonOnPress={() => {
          setShowPermissionModal(false);
          let targetSettings = PermissionManager.navigationTargets.settings;
          if(requestedPermissions.length == 1) {
            const requestedPermission = requestedPermissions[0];
            switch(requestedPermission) {
              case "Notifications": {
                targetSettings = PermissionManager.navigationTargets.notificationSettings
                break;
              }
              case "Location": {
                targetSettings = PermissionManager.navigationTargets.locationSettings
                break;
              }
            }
          }
          PermissionManager.navigateToSettings(targetSettings);
        }}
        disableOnPress
        useCloseButton
        description={requestedPermissions.includes("Notifications") ? notificationModalDescription : locationModalDescription}
        instructionText={locationModalInstructionText}/>
      </ScrollView>
    </>
  )
}

const styles = {
  warning : {
    color : palette.red,
    maxWidth : 300,
    fontWeight : "bold"
  },
  buttonMargin : {
    marginTop : 10
  },
  card : {
    alignSelf : "center",
    alignItems : "center",
    backgroundColor : palette.white,
    elevation : 2,
    borderRadius : 10,
    padding : 20,
    marginVertical : 10,
    width : "90%"
  },
  deleteCardTextStyle : {
    color : palette.red
  },
  deleteCardIconStyle : {
    color : palette.red
  }
}

export default Settings;
