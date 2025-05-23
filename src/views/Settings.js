import React, { useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { Text, ScrollView,
         View, Switch } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Clipboard from '@react-native-clipboard/clipboard';
import ServiceInterface from '../nativeWrapper/ServiceInterface';
import QRCodeModal from './QRCodeModal';
import Header from './Header';
import CustomButton from './CustomButton';
import CardButton from './CardButton';
import PermissionModal from './PermissionModal';
import ConfirmationModal from './ConfirmationModal';

import PermissionManager from '../nativeWrapper/PermissionManager';
import Bluetooth from '../nativeWrapper/Bluetooth';

import { closeChatRealm } from '../realm/chatRealm';
import { closeContactRealm } from '../realm/contactRealm';
import { closePasswordRealm } from '../realm/passwordRealm';
import { parseRealmID } from '../helper';

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
import { requestEnableBluetooth, requestPermissionsForBluetooth, STORAGE_STRINGS } from '../common';

const Settings = ({ navigation }) => {
  const dispatch = useDispatch();
  const customStyle = useSelector(state => state.appStateReducer.styles);
  const [QRCodeVisible, setQRCodeVisible] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [requestedPermissions, setRequestedPermissions] = useState([]);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [confirmationModalText, setConfirmationModalText] = useState("");

  const confirmationModalOnConfirm = useRef(() => {});

  const publicKey = useSelector(state => state.userReducer.publicKey);
  const userHasPassword = useSelector(state => state.userReducer.loginPasswordHash).length > 0;
  const enableNotifications = useSelector(state => state.appStateReducer.sendNotificationForNewMessages);
  const backgroundServiceRunning = useSelector(state => state.appStateReducer.backgroundServiceRunning)

  const cardIconSize = useScreenAdjustedSize(0.075,0.05) + (customStyle.scaledUIFontSize*0.2);
  
  const alreadyNavigating = useRef(false);

  const copyKeyToClipboard = async () => {
    Clipboard.setString(publicKey);
    return true;
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

      const locationEnabled = await Bluetooth.checkLocationEnabled();
      if(!locationEnabled) {
        setConfirmationModalText("Location needs to be enabled to run the background service, enable it now?")
        confirmationModalOnConfirm.current = () => {
          PermissionManager.navigateToSettings(PermissionManager.navigationTargets.locationSettings)
          setShowConfirmationModal(false);
        }
        setShowConfirmationModal(true);
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
          publicKey.trim(),
          enableNotifications
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
      dispatch(setEnableNotifications(enableNotifications));
      await AsyncStorage.setItem(STORAGE_STRINGS.ENABLE_NOTIFICATIONS,enableNotifications.toString());
      ServiceInterface.setAllowNotifications(enableNotifications);
      dispatch(setLockable(true));
    }
    else {
      dispatch(setEnableNotifications(false));
      await AsyncStorage.setItem(STORAGE_STRINGS.ENABLE_NOTIFICATIONS,false.toString())
      ServiceInterface.setAllowNotifications(false);
    }
  }

  const locationModalDescription = `In order to transfer messages in the background, herd requires \
certain permissions to be allowed all the time.`

  const locationModalInstructionText = `Please go into the permission settings for Herd and select 'Allow all the time' \
for the following permissions in order to allow Herd to function correctly.`

  const notificationModalDescription = `In order to send you notifications when new messages are received, Herd requires \
certain permissions to be allowed all the time`

  const switchProps = {
    disabled : QRCodeVisible,
    trackColor : { false : palette.grey, true : palette.primary},
    ios_backgroundColor : palette.primary
  }

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
            {...switchProps}
            style={{marginLeft : 10}}
            onValueChange={val => toggleBackgroundTransfer(val)}
            value={backgroundServiceRunning}
            thumbColor={backgroundServiceRunning ? palette.secondary : palette.lightgrey}/>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={{fontWeight : "bold", fontSize : customStyle.scaledUIFontSize}}> Send me a notification when new messages are received</Text>
          <Switch
          {...switchProps}
          style={{marginTop: 10}}
          onValueChange={async val => await toggleNotifications(val)}
          value={enableNotifications}
          thumbColor={enableNotifications ? palette.secondary : palette.lightgrey}/>
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
        onPress={() => {
          setConfirmationModalText("Are you sure you want to delete all chats?"),
          confirmationModalOnConfirm.current = () => {
            deleteAllChatsFromRealm();
            dispatch(deleteChats("all"));
            setShowConfirmationModal(false);
          }
          setShowConfirmationModal(true);
        }}/>

        <CardButton
        text="Delete All Contacts"
        textStyle={styles.deleteCardTextStyle}
        iconStyle={styles.deleteCardIconStyle}
        rightIcon="delete"
        iconSize={cardIconSize}
        onPress={() => {
          setConfirmationModalText("Are you sure you want to delete all contacts?"),
          confirmationModalOnConfirm.current = () => {
            deleteAllContactsFromRealm();
            deleteAllChatsFromRealm();
            dispatch(deleteChats("all"))
            dispatch(resetContacts());
            setShowConfirmationModal(false);
          }
          setShowConfirmationModal(true);
        }}/>

        <CardButton
        text="Delete All Messages"
        textStyle={styles.deleteCardTextStyle}
        iconStyle={styles.deleteCardIconStyle}
        rightIcon="delete-forever"
        iconSize={cardIconSize}
        onPress={() => {
          setConfirmationModalText("Are you sure you want to delete all messages?"),
          confirmationModalOnConfirm.current = () => {
            deleteAllMessagesFromRealm();
            dispatch(deleteChats("all"));
            dispatch(setMessageQueue([]));
            setShowConfirmationModal(false);
          }
          setShowConfirmationModal(true);
        }}/>

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

        <ConfirmationModal
        visible={showConfirmationModal}
        titleText={confirmationModalText}
        confirmText='Yes'
        cancelText='No'
        onConfirm={confirmationModalOnConfirm.current}
        onCancel={() => setShowConfirmationModal(false)}
        />
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
