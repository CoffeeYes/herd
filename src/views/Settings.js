import React, { useState, useEffect } from 'react';
import { Text, TouchableOpacity, ScrollView, View, Modal, Switch, Alert, Dimensions } from 'react-native';
import { useClipboard } from '@react-native-community/clipboard';
import Crypto from '../nativeWrapper/Crypto';
import ServiceInterface from '../nativeWrapper/ServiceInterface';
import Bluetooth from '../nativeWrapper/Bluetooth';
import QRCodeModal from './QRCodeModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from './Header';
import FlashTextButton from './FlashTextButton';
import CustomButton from './CustomButton';
import { closeChatRealm } from '../realm/chatRealm';
import { closeContactRealm } from '../realm/contactRealm';
import CardButton from './CardButton';

import { deleteAllChats as deleteAllChatsFromRealm } from '../realm/chatRealm';
import { deleteAllContacts as deleteAllContactsFromRealm} from '../realm/contactRealm'

const Settings = ({ navigation }) => {
  const [data, setClipboard] = useClipboard();
  const [QRCodeVisible, setQRCodeVisible] = useState(false);
  const [publicKey, setPublicKey] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [backgroundTransfer, setBackgroundTransfer] = useState(false);

  const copyKeyToClipboard = async () => {
    setClipboard(await Crypto.loadKeyFromKeystore("herdPersonal"))
  }

  const showQRCode = async () => {
    const personalPublicKey = await Crypto.loadKeyFromKeystore("herdPersonal");
    await setPublicKey(personalPublicKey)
    setQRCodeVisible(true);
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
            deleteAllChatsFromRealm()
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
          },
        },
      ]
    );
  }

  const toggleBackgroundTransfer = async value => {
    if(value) {
      var btEnabled = await Bluetooth.checkBTEnabled();
      var locationEnabled = await Bluetooth.checkLocationEnabled();

      if(!btEnabled) {
        btEnabled = await Bluetooth.requestBTEnable();
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
      }

      if(btEnabled && locationEnabled) {
        setBackgroundTransfer(true);
        ServiceInterface.enableService();
      }
    }
    else {
      setBackgroundTransfer(false);
      ServiceInterface.disableService();
    }
  }

  useEffect(() => {
    ServiceInterface.isRunning().then(running => setBackgroundTransfer(running))
  },[])

  return (
    <>
      <Header title="Settings"/>

      <ScrollView contentContainerStyle={{alignItems : "center"}}>

        <View style={{
          alignSelf : "center",
          alignItems : "center",
          backgroundColor : "white",
          elevation : 2,
          borderRadius : 10,
          padding : 20,
          marginVertical : 10,
          width : Dimensions.get('window').width * 0.9}}>
          {!backgroundTransfer &&
          <Text style={styles.warning}>
          WARNING : if you disable background transfers your messages
          will not be transmitted
          </Text>}
          <View style={{flexDirection : "row", marginVertical: 10}}>
            <Text>Background Transfers</Text>
            <Switch
            style={{marginLeft : 10}}
            onValueChange={toggleBackgroundTransfer}
            value={backgroundTransfer}
            trackColor={{ false: "#767577", true: "#E86252" }}
            thumbColor={backgroundTransfer ? "#EBB3A9" : "#f4f3f4"}
            ios_backgroundColor="#E86252"/>
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
        onPress={showQRCode}/>

        <CardButton
        text="Customise"
        rightIcon="edit"
        onPress={() => navigation.navigate("customise")}/>

        <CardButton
        text="Message Queue"
        rightIcon="message"
        onPress={() => navigation.navigate("messageQueue")}/>

        <CardButton
        text="Delete All Chats"
        textStyle={{color : "red"}}
        iconStyle={{color : "red"}}
        rightIcon="delete-forever"
        onPress={deleteAllChats}/>

        <CardButton
        text="Delete All Contacts"
        textStyle={{color : "red"}}
        iconStyle={{color : "red"}}
        rightIcon="delete-sweep"
        onPress={deleteAllContacts}/>

        {__DEV__ &&
          <CustomButton
          buttonStyle={{backgroundColor : "red",...styles.buttonMargin}}
          onPress={() => {
            closeChatRealm();
            closeContactRealm();
          }}
          text="Close Realm"/>
        }

        <QRCodeModal
        visible={QRCodeVisible}
        value={{key : publicKey}}
        title="My Key"
        setVisible={setQRCodeVisible}/>

      </ScrollView>
    </>
  )
}

const styles = {
  warning : {
    color : "red",
    maxWidth : 300
  },
  buttonMargin : {
    marginTop : 10
  }
}

export default Settings;
