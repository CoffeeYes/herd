import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Text, TouchableOpacity, ScrollView, View, Modal, Switch, Alert, Dimensions } from 'react-native';
import { useClipboard } from '@react-native-community/clipboard';
import Crypto from '../nativeWrapper/Crypto';
import ServiceInterface from '../nativeWrapper/ServiceInterface';
import Bluetooth from '../nativeWrapper/Bluetooth';
import QRCodeModal from './QRCodeModal';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from './Header';
import CustomButton from './CustomButton';
import CardButton from './CardButton';
import LocationModal from './LocationModal';

import { closeChatRealm } from '../realm/chatRealm';
import { closeContactRealm } from '../realm/contactRealm';
import { getPasswordHash, closePasswordRealm } from '../realm/passwordRealm';
import { parseRealmID } from '../realm/helper';

import { setChats, resetMessages, setMessageQueue } from '../redux/actions/chatActions';
import { setContacts, resetContacts } from '../redux/actions/contactActions';

import { palette } from '../assets/palette'

import {
  getMessageQueue,
  getDeletedReceivedMessages,
  getReceivedMessagesForSelf,
  deleteAllMessages as deleteAllMessagesFromRealm,
  deleteAllChats as deleteAllChatsFromRealm } from '../realm/chatRealm';
import { deleteAllContacts as deleteAllContactsFromRealm} from '../realm/contactRealm'

const Settings = ({ navigation }) => {
  const dispatch = useDispatch();
  const [data, setClipboard] = useClipboard();
  const [QRCodeVisible, setQRCodeVisible] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [backgroundTransfer, setBackgroundTransfer] = useState(false);

  const publicKey = useSelector(state => state.userReducer.publicKey);
  const userHasPassword = useSelector(state => state.userReducer.loginPasswordHash).length > 0;

  useEffect(() => {
    ServiceInterface.isRunning().then(running => setBackgroundTransfer(running))
  },[]);

  const copyKeyToClipboard = async () => {
    setClipboard(await Crypto.loadKeyFromKeystore("herdPersonal"));
    return true;
  }

  const deleteAllChats = async () => {
    Alert.alert(
      'Discard you sure you want to delete all chats?',
      '',
      [
        { text: "Cancel", style: 'cancel', onPress: () => {} },
        {
          text: 'Delete',
          style: 'destructive',
          // If the user confirmed, then we dispatch the action we blocked earlier
          // This will continue the action that had triggered the removal of the screen
          onPress: () => {
            deleteAllChatsFromRealm();
            dispatch(setChats([]));
          },
        },
      ]
    );

  }

  const deleteAllContacts = async() => {
    Alert.alert(
      'Discard you sure you want to delete all Contacts?',
      '',
      [
        { text: "Cancel", style: 'cancel', onPress: () => {} },
        {
          text: 'Delete',
          style: 'destructive',
          // If the user confirmed, then we dispatch the action we blocked earlier
          // This will continue the action that had triggered the removal of the screen
          onPress: async () => {
            deleteAllContactsFromRealm();
            deleteAllChatsFromRealm();
            dispatch(resetContacts());
          },
        },
      ]
    );
  }

  const deleteAllMessages = async () => {
    Alert.alert(
      'Discard you sure you want to delete all Messages?',
      '',
      [
        { text: "Cancel", style: 'cancel', onPress: () => {} },
        {
          text: 'Delete',
          style: 'destructive',
          // If the user confirmed, then we dispatch the action we blocked earlier
          // This will continue the action that had triggered the removal of the screen
          onPress: async () => {
            deleteAllMessagesFromRealm();
            dispatch(setChats([]));
            dispatch(setMessageQueue([]));
          },
        },
      ]
    );
  }

  const toggleBackgroundTransfer = async value => {
    if(value) {
      let locationPermissionsGranted = await Bluetooth.checkLocationPermission();
      const bluetoothScanPermissionsGranted = await Bluetooth.checkBTPermissions();
      let btEnabled = await Bluetooth.checkBTEnabled();
      let locationEnabled = await Bluetooth.checkLocationEnabled();

      if(!bluetoothScanPermissionsGranted) {
        const grantBluetoothScanPermissions = await Bluetooth.requestBTPermissions();
        if(!grantBluetoothScanPermissions) {
          return;
        }
      }

      if(!locationPermissionsGranted) {
        const grantLocationPermissions = await Bluetooth.requestLocationPermissions();
        if(!grantLocationPermissions) {
          setShowLocationModal(true);
          return;
        }
      }

      if(!btEnabled) {
        btEnabled = await Bluetooth.requestBTEnable();
        if(!btEnabled) {
          return;
        }
      }

      if(!locationEnabled) {
        Alert.alert(
          "Location",
          "Location is required to run in the background, enable it now?",
          [
            {text : "No"},
            {text : "Yes", onPress : async () => locationEnabled = await Bluetooth.requestLocationEnable()}
          ]
        )
        if(!locationEnabled) {
          return;
        }
      }

      if(btEnabled && locationEnabled) {
        setBackgroundTransfer(true);
        const messageQueue = (await getMessageQueue(false)).map(msg => ({...msg,_id : parseRealmID(msg)}));
        const deletedReceivedMessages = getDeletedReceivedMessages().map(msg => ({...msg,_id : parseRealmID(msg)}));
        const publicKey = (await Crypto.loadKeyFromKeystore("herdPersonal")).trim();
        const receivedMessagesForSelf = getReceivedMessagesForSelf(publicKey);
        ServiceInterface.enableService(
          messageQueue,
          receivedMessagesForSelf,
          deletedReceivedMessages,
          publicKey
        );
      }
    }
    else {
      setBackgroundTransfer(false);
      if(await ServiceInterface.isRunning()) {
        ServiceInterface.disableService();
      }
    }
  }

  const closeRealms = () => {
    closeChatRealm();
    closeContactRealm();
    closePasswordRealm();
  }

  const locationModalDescription = `In order to transfer messages in the background, herd requires \
location permissions to be allowed all the time.`

  const locationModalInstructionText = `Please go into the permission settings for Herd and select 'Allow all the time' \
in order to allow Herd to function correctly.`

  return (
    <>
      <Header title="Settings"/>

      <ScrollView contentContainerStyle={{alignItems : "center"}}>

        <View style={styles.backgroundTransferCard}>

          {!backgroundTransfer &&
          <Text style={styles.warning}>
          WARNING : if you disable background transfers your messages
          will not be transmitted
          </Text>}
          
          <View style={{flexDirection : "row", marginVertical: 10}}>
            <Text style={{fontWeight : "bold"}}>Background Transfers</Text>
            <Switch
            style={{marginLeft : 10}}
            onValueChange={toggleBackgroundTransfer}
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
        onPress={copyKeyToClipboard}/>

        <CardButton
        text="Show My QR Code"
        rightIcon="qr-code-2"
        onPress={() => setQRCodeVisible(true)}/>

        <CardButton
        text="Customise"
        rightIcon="edit"
        onPress={() => navigation.navigate("customise")}/>

        <CardButton
        text="Message Queue"
        rightIcon="message"
        onPress={() => navigation.navigate("messageQueue")}/>

        <CardButton
        text="Password Protection"
        rightIcon="lock"
        onPress={() => userHasPassword ?
          navigation.navigate("passwordLockScreen",{navigationTarget : "passwordSettings"})
          :
          navigation.navigate("passwordSettings")}
        />

        <CardButton
        text="Delete All Chats"
        textStyle={{color : palette.red}}
        iconStyle={{color : palette.red}}
        rightIcon="delete"
        onPress={deleteAllChats}/>

        <CardButton
        text="Delete All Contacts"
        textStyle={{color : palette.red}}
        iconStyle={{color : palette.red}}
        rightIcon="delete-sweep"
        onPress={deleteAllContacts}/>

        <CardButton
        text="Delete All Messages"
        textStyle={{color : palette.red}}
        iconStyle={{color : palette.red}}
        rightIcon="delete-forever"
        onPress={deleteAllMessages}/>

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

        <LocationModal
        visible={showLocationModal}
        modalOnPress={() => setShowLocationModal(false)}
        onRequestClose={() => setShowLocationModal(false)}
        buttonOnPress={() => {
          setShowLocationModal(false);
          Bluetooth.navigateToApplicationSettings();
        }}
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
  modalMainContainer : {
    alignItems : "center",
    justifyContent : "center",
    flex : 1,
    backgroundColor : "rgba(0,0,0,0.4)"
  },
  modalContentContainer : {
    backgroundColor : palette.white,
    borderRadius : 5,
    padding : 30,
    alignItems : "center",
    maxWidth : Dimensions.get('window').width * 0.8,
    maxHeight : Dimensions.get('window').height * 0.8
  },
  backgroundTransferCard : {
    alignSelf : "center",
    alignItems : "center",
    backgroundColor : palette.white,
    elevation : 2,
    borderRadius : 10,
    padding : 20,
    marginVertical : 10,
    width : Dimensions.get('window').width * 0.9
  }
}

export default Settings;
