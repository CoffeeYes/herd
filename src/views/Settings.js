import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useIsFocused } from '@react-navigation/native';
import { Text, ScrollView,
         View, Switch, Alert, 
         NativeEventEmitter } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import ServiceInterface from '../nativeWrapper/ServiceInterface';
import Bluetooth from '../nativeWrapper/Bluetooth';
import QRCodeModal from './QRCodeModal';
import Header from './Header';
import CustomButton from './CustomButton';
import CardButton from './CardButton';
import PermissionModal from './PermissionModal';

import { closeChatRealm } from '../realm/chatRealm';
import { closeContactRealm } from '../realm/contactRealm';
import { closePasswordRealm } from '../realm/passwordRealm';
import { parseRealmID } from '../realm/helper';

import { setChats, setMessageQueue, deleteChats } from '../redux/actions/chatActions';
import { resetContacts } from '../redux/actions/contactActions';
import { setLockable } from '../redux/actions/appStateActions';

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
  const [backgroundTransfer, setBackgroundTransfer] = useState(false);
  const [requestedPermissions, setRequestedPermissions] = useState([]);

  const publicKey = useSelector(state => state.userReducer.publicKey);
  const userHasPassword = useSelector(state => state.userReducer.loginPasswordHash).length > 0;

  const cardIconSize = useScreenAdjustedSize(0.075,0.05) + (customStyle.scaledUIFontSize*0.2);
  
  const focused = useIsFocused();
  const alreadyNavigating = useRef(false);

  useEffect(() => {
    ServiceInterface.isRunning().then(running => setBackgroundTransfer(running));

    const eventEmitter = new NativeEventEmitter(ServiceInterface);

    const bluetoothAndLocationStateListener = eventEmitter.addListener("bluetoothOrLocationStateChange", state => {
      if(state === "ADAPTER_TURNED_OFF" || state === "LOCATION_DISABLED") {
        setBackgroundTransfer(false);
      }
    })

    return () => bluetoothAndLocationStateListener.remove();
  },[]);

  const copyKeyToClipboard = async () => {
    Clipboard.setString(publicKey);
    return true;
  }

  useEffect(() => {
    showPermissionModal && dispatch(setLockable(true))
  },[showPermissionModal])

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
        setBackgroundTransfer(true);
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
      setBackgroundTransfer(false);
      if(await ServiceInterface.isRunning()) {
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

  useEffect(() => {
    if(focused) {
      alreadyNavigating.current = false;
    }
  },[focused])

  const navigate = (route, params) => {
    if(!alreadyNavigating.current && !QRCodeVisible) {
      alreadyNavigating.current = true;
      navigation.navigate(route,params);
    }
  }

  const locationModalDescription = `In order to transfer messages in the background, herd requires \
certain permissions to be allowed all the time.`

  const locationModalInstructionText = `Please go into the permission settings for Herd and select 'Allow all the time' \
for the following permissions in order to allow Herd to function correctly.`

  return (
    <>
      <Header title="Settings"/>

      <ScrollView contentContainerStyle={{alignItems : "center", paddingBottom : 10}}>

        <View style={styles.backgroundTransferCard}>

          {!backgroundTransfer &&
          <Text style={{...styles.warning, fontSize : customStyle.scaledUIFontSize}}>
          WARNING : if you disable background transfers your messages
          will not be transmitted
          </Text>}

          <View style={{flexDirection : "row", marginVertical: 10}}>
            <Text style={{fontWeight : "bold", fontSize : customStyle.scaledUIFontSize}}>Background Transfers</Text>
            <Switch
            style={{marginLeft : 10}}
            onValueChange={val => !QRCodeVisible && toggleBackgroundTransfer(val)}
            value={backgroundTransfer}
            trackColor={{ false: palette.grey, true: palette.primary }}
            thumbColor={backgroundTransfer ? palette.secondary : palette.lightgrey}
            ios_backgroundColor={palette.primary}/>
          </View>
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
            dispatch(setChats([]));
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
        icon="location-on"
        visible={showPermissionModal}
        permissions={requestedPermissions}
        onRequestClose={() => setShowPermissionModal(false)}
        buttonOnPress={() => {
          setShowPermissionModal(false);
          Bluetooth.navigateToApplicationSettings();
        }}
        disableOnPress
        useCloseButton
        description={locationModalDescription}
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
  backgroundTransferCard : {
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
