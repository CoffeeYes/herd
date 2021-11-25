import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, ActivityIndicator, NativeEventEmitter } from 'react-native';
import Bluetooth from '../nativeWrapper/Bluetooth';
import Crypto from '../nativeWrapper/Crypto';
import CustomModal from './CustomModal';
import CustomButton from './CustomButton';
import navigationRef from '../NavigationRef';

const BTExchangeModal = ({ navigation, visible, setVisible}) => {
  const [loading, setLoading] = useState(true);
  const [activityText, setActivityText] = useState("Waiting On Other Device");

  useEffect(() => {
    const eventEmitter = new NativeEventEmitter(Bluetooth);
    var messageListener;
    if(visible) {
      messageListener = eventEmitter.addListener("newBTMessageReceived", msg => {
        console.log(msg)
      });
    }
    else {
      messageListener?.remove();
    }
  },[visible])

  const cancel = async () => {
    await Bluetooth.cancelListenAsServer();
    await Bluetooth.cancelConnectAsClient();
    await Bluetooth.cancelBTConnectionThread();
    setVisible(false);
  }

  const test = async () => {
    const key = await Crypto.loadKeyFromKeystore("herdPersonal");
    await Bluetooth.writeToBTConnection(key);
  }

  return (
    <CustomModal
    visible={visible}
    setVisible={setVisible}>
        <View style={styles.modalContentContainer}>
          {loading && <ActivityIndicator size="large" color="#e05e3f"/>}
          <Text>{activityText}</Text>
          <CustomButton
          onPress={cancel}
          buttonStyle={{marginTop : 10}}
          text="Cancel"/>
          <CustomButton
          onPress={test}
          buttonStyle={{marginTop : 10}}
          text="test"/>
        </View>
    </CustomModal>
  )
}

const styles = {
  modalContentContainer : {
    backgroundColor : "white",
    borderRadius : 5,
    padding : 20,
    alignItems : "center"
  }
}

export default BTExchangeModal;
