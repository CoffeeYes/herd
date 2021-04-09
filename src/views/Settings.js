import React, { useState } from 'react';
import { Text, TouchableOpacity, ScrollView, View, Modal, Switch } from 'react-native';
import { useClipboard } from '@react-native-community/clipboard';
import Crypto from '../nativeWrapper/Crypto';
import QRCodeModal from './QRCodeModal';
import ConfirmModal from './ConfirmModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from './Header';

const Settings = ({ navigation }) => {
  const [data, setClipboard] = useClipboard();
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [QRCodeVisible, setQRCodeVisible] = useState(false);
  const [publicKey, setPublicKey] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
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
    setModalLoading(true);
    const contacts = JSON.parse(await AsyncStorage.getItem("contacts"));

    contacts.map(async contact => {
      await AsyncStorage.setItem(contact.name,JSON.stringify([]));
    })

    setModalLoading(false);
    setShowDeleteModal(false);
  }

  return (
    <View>
      <Header title="Settings"/>

      <View style={{alignSelf : "center",alignItems : "center"}}>
        {!backgroundTransfer &&
        <Text style={styles.warning}>
        WARNING : if you disable background transfer your messages
        will not be transmitted
        </Text>}
        <Text>Background Transfers</Text>
        <Switch
        onValueChange={() => setBackgroundTransfer(!backgroundTransfer)}
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

        <QRCodeModal visible={QRCodeVisible} text={publicKey} setVisible={setQRCodeVisible}/>

        <TouchableOpacity
        style={{...styles.button,backgroundColor : "red"}}
        onPress={() => setShowDeleteModal(true)}>
          <Text style={styles.buttonText}> Delete All Chats </Text>
        </TouchableOpacity>

        <ConfirmModal
        visible={showDeleteModal}
        setVisible={setShowDeleteModal}
        onConfirm={deleteAllChats}
        header={"Are you sure?"}
        loading={modalLoading}/>
      </ScrollView>
    </View>
  )
}

const styles ={
  button : {
    backgroundColor : "#E86252",
    padding : 10,
    alignSelf : "center",
    marginTop : 10,
    borderRadius : 5
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
