import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { View, Text, ActivityIndicator, NativeEventEmitter } from 'react-native';
import Bluetooth from '../nativeWrapper/Bluetooth';
import CustomModal from './CustomModal';
import CustomButton from './CustomButton';

import { palette } from '../assets/palette';
import { useOrientationBasedStyle } from '../helper';

const activityStateText = {
  waiting :  "Waiting On Other Device",
  connected : "Connected, Waiting for Data",
  disconnected : "Disconnected"
};

const BTExchangeModal = ({ onRequestClose, onCancel, onSuccess}) => {
  const [loading, setLoading] = useState(true);
  const [activityText, setActivityText] = useState(activityStateText.waiting);
  const [receivedKey, setReceivedKey] = useState("");
  const [keySent, setKeySent] = useState(false);

  const customStyle = useSelector(state => state.chatReducer.styles);
  const publicKey = useSelector(state => state.userReducer.publicKey);

  const contentWidth = useOrientationBasedStyle({width : "80%"},{width : "60%"});

  useEffect(() => {
    const eventEmitter = new NativeEventEmitter(Bluetooth);

    //listen for connected state to begin key exchange
    const stateChangeListener = eventEmitter.addListener("BTConnectionStateChange", async state => {
      if(state === "Connected") {
        setActivityText(activityStateText.connected);
        await Bluetooth.writeToBTConnection(JSON.stringify({key : publicKey}));
      }
      else if (state === "Disconnected") {
        setActivityText(activityStateText.disconnected);
        setLoading(false);
        cancelBluetoothActions();
      }
    })

    //listen for messages to receive keys and ACKS
    const messageListener = eventEmitter.addListener("newBTMessageReceived", msg => {
      try {
        const message = JSON.parse(msg);
        if(message?.key) {
          setReceivedKey(message.key);
          Bluetooth.writeToBTConnection(JSON.stringify({haveReceivedKey : true}));
        }
        if(message?.haveReceivedKey) {
          setKeySent(true);
        }
      }
      catch(e) {
        console.log("Error parsing JSON : ",e);
      }
    });
    //remove all listeners and cancel threads, reset variables
    return () => {
      messageListener?.remove();
      stateChangeListener?.remove();
      cancelBluetoothActions();
    }
  },[])

  useEffect(() => {
    if(receivedKey.length > 0 && keySent) {
      cancelBluetoothActions();
      onSuccess({publicKey : receivedKey})
    }
  },[keySent, receivedKey])

  const cancelBluetoothActions = async () => {
    await Bluetooth.cancelListenAsServer();
    await Bluetooth.cancelConnectAsClient();
    await Bluetooth.cancelBTConnectionThread();
  }

  return (
    <CustomModal
    onRequestClose={onRequestClose}
    disableOnPress>
      <View style={{...styles.modalContentContainer, ...contentWidth}}>
        <ActivityIndicator size="large" color={palette.primary} animating={loading}/>
        <Text style={{fontSize : customStyle.scaledUIFontSize}}>{activityText}</Text>
        <CustomButton
        onPress={() => {
          cancelBluetoothActions();
          onCancel();
        }}
        buttonStyle={{marginTop : 10}}
        text="Cancel"/>
      </View>
    </CustomModal>
  )
}

const styles = {
  modalContentContainer : {
    backgroundColor : palette.white,
    borderRadius : 5,
    padding : 20,
    alignItems : "center"
  }
}

export default BTExchangeModal;
