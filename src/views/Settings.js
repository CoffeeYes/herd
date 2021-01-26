import React, { useState } from 'react';
import { Text, TouchableOpacity, ScrollView, View, Modal } from 'react-native';
import { useClipboard } from '@react-native-community/clipboard';
import Crypto from '../nativeWrapper/Crypto';
import QRCodeModal from './QRCodeModal';
import ConfirmModal from './ConfirmModal';

const Settings = ({ navigation }) => {
  const [data, setClipboard] = useClipboard();
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [QRCodeVisible, setQRCodeVisible] = useState(false);
  const [publicKey, setPublicKey] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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

  }

  return (
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
      header={"Are you sure?"}/>
    </ScrollView>
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
    textAlign : "center"
  }
}

export default Settings;
