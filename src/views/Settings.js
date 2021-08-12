import React, { useState, useEffect } from 'react';
import { Text, TouchableOpacity, ScrollView, View, Modal, Switch, Alert, Dimensions } from 'react-native';
import { useClipboard } from '@react-native-community/clipboard';
import Crypto from '../nativeWrapper/Crypto';
import ServiceInterface from '../nativeWrapper/ServiceInterface';
import Bluetooth from '../nativeWrapper/Bluetooth';
import QRCodeModal from './QRCodeModal';
import ConfirmModal from './ConfirmModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from './Header';

import { deleteAllChats as deleteAllChatsFromRealm } from '../realm/chatRealm'

const Settings = ({ navigation }) => {
  const [data, setClipboard] = useClipboard();
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [QRCodeVisible, setQRCodeVisible] = useState(false);
  const [publicKey, setPublicKey] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [backgroundTransfer, setBackgroundTransfer] = useState(false);

  const copyKeyToClipboard = () => {
    Crypto.loadKeyFromKeystore("herdPersonal").then(key => {
      setClipboard(key)
      setShowSnackbar(true);
      setTimeout(() => {setShowSnackbar(false)},500)
    })
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
            await AsyncStorage.setItem("contacts",JSON.stringify([]));
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
    <View>

      <View style={{alignSelf : "center",alignItems : "center"}}>
        {!backgroundTransfer &&
        <Text style={styles.warning}>
        WARNING : if you disable background transfers your messages
        will not be transmitted
        </Text>}
        <Text>Background Transfers</Text>
        <Switch
        onValueChange={toggleBackgroundTransfer}
        value={backgroundTransfer}
        trackColor={{ false: "#767577", true: "#E86252" }}
        thumbColor={backgroundTransfer ? "#EBB3A9" : "#f4f3f4"}
        ios_backgroundColor="#E86252"/>
      </View>

      <ScrollView>
        {showSnackbar &&
        <Text style={{alignSelf : "center",fontSize : 18, fontWeight : "bold"}}>Copied!</Text>}
        <TouchableOpacity
        style={styles.button}
        onPress={copyKeyToClipboard}>
          <Text style={styles.buttonText}> Copy your key </Text>
        </TouchableOpacity>

        <TouchableOpacity
        style={styles.button}
        onPress={showQRCode}>
          <Text style={styles.buttonText}> Show QR Code </Text>
        </TouchableOpacity>

        <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("customise")}>
          <Text style={styles.buttonText}> Customise </Text>
        </TouchableOpacity>

        <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("messageQueue")}>
          <Text style={styles.buttonText}> Message Queue </Text>
        </TouchableOpacity>

        <QRCodeModal visible={QRCodeVisible} text={publicKey} setVisible={setQRCodeVisible}/>

        <TouchableOpacity
        style={{...styles.button,backgroundColor : "red"}}
        onPress={deleteAllChats}>
          <Text style={styles.buttonText}> Delete All Chats </Text>
        </TouchableOpacity>
        <TouchableOpacity
        style={{...styles.button,backgroundColor : "red"}}
        onPress={deleteAllContacts}>
          <Text style={styles.buttonText}> Delete All Contacts </Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
    </>
  )
}

const styles ={
  button : {
    backgroundColor : "#E86252",
    padding : 10,
    alignSelf : "center",
    marginTop : 10,
    borderRadius : 5,
    width : Dimensions.get("window").width * 0.3
  },
  buttonText : {
    color : "white",
    fontWeight : "bold",
    textAlign : "center",
    fontFamily : "Open-Sans"
  },
  warning : {
    color : "red",
    maxWidth : 300
  }
}

export default Settings;
