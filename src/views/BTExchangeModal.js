import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { View, Text, Modal, TouchableOpacity, ActivityIndicator, NativeEventEmitter } from 'react-native';
import Bluetooth from '../nativeWrapper/Bluetooth';
import Crypto from '../nativeWrapper/Crypto';
import CustomModal from './CustomModal';
import CustomButton from './CustomButton';

import { palette } from '../assets/palette';
import { useOrientationBasedStyle } from '../helper';

const BTExchangeModal = ({ navigation, visible, onRequestClose, onCancel, onSuccess}) => {
  const [loading, setLoading] = useState(true);
  const [activityText, setActivityText] = useState("Waiting On Other Device");
  const [otherKey, _setOtherKey] = useState("");
  const [keyReceived, _setKeyReceived] = useState(false);
  const [keySent, _setKeySent] = useState(false);

  const customStyle = useSelector(state => state.chatReducer.styles);
  const publicKey = useSelector(state => state.userReducer.publicKey);

  const contentWidth = useOrientationBasedStyle({width : "80%"},{width : "60%"});

  const otherKeyRef = useRef();
  const keyReceivedRef = useRef();
  const keySentRef = useRef();

  const setOtherKey = data => {
    otherKeyRef.current = data;
    _setOtherKey(data);
  }
  const setKeyReceived = data => {
    keyReceivedRef.current = data;
    _setKeyReceived(data);
  }
  const setKeySent = data => {
    keySentRef.current = data;
    _setKeySent(data);
  }

  useEffect(() => {
    const eventEmitter = new NativeEventEmitter(Bluetooth);
    let messageListener;
    let stateChangeListener;

    if(visible) {
      //listen for connected state to begin key exchange
      stateChangeListener = eventEmitter.addListener("BTConnectionStateChange", async state => {
        if(state === "Connected") {
          setActivityText("Connected, Waiting for Data");
          await Bluetooth.writeToBTConnection(JSON.stringify({key : publicKey}));
        }
      })
      //listen for messages to receive keys and ACKS
      messageListener = eventEmitter.addListener("newBTMessageReceived", msg => {
        try {
          const message = JSON.parse(msg);
          if(message?.key) {
            setOtherKey(message.key);
            setKeyReceived(true);
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
    }
    //remove all listeners and cancel threads, reset variables
    else {
      messageListener?.remove();
      stateChangeListener?.remove();
      cancelBluetoothActions();
      setKeySent(false);
      setKeyReceived(false);
      setOtherKey("");
    }
  },[visible])

  //navigate to createContact when keys have been exchanged
  useEffect(() => {
    if(keySentRef.current && keyReceivedRef.current) {
      onSuccess({publicKey : otherKeyRef.current})
    }
  },[keySentRef.current,keyReceivedRef.current])

  const cancelBluetoothActions = async () => {
    await Bluetooth.cancelListenAsServer();
    await Bluetooth.cancelConnectAsClient();
    await Bluetooth.cancelBTConnectionThread();
  }

  return (
    <CustomModal
    visible={visible}
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
