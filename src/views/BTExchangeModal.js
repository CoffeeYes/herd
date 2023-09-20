import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { View, Text, Modal, TouchableOpacity, ActivityIndicator, NativeEventEmitter } from 'react-native';
import Bluetooth from '../nativeWrapper/Bluetooth';
import Crypto from '../nativeWrapper/Crypto';
import CustomModal from './CustomModal';
import CustomButton from './CustomButton';
import navigationRef from '../NavigationRef';

import { palette } from '../assets/palette';
import { useScreenAdjustedSize } from '../helper';

const BTExchangeModal = ({ navigation, visible, setVisible}) => {
  const [loading, setLoading] = useState(true);
  const [activityText, setActivityText] = useState("Waiting On Other Device");
  const [otherKey, _setOtherKey] = useState("");
  const [keyReceived, _setKeyReceived] = useState(false);
  const [keySent, _setKeySent] = useState(false);

  const customStyle = useSelector(state => state.chatReducer.styles);
  const publicKey = useSelector(state => state.userReducer.publicKey);

  const contentWidth = useScreenAdjustedSize(0.8,0.6);

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
      Bluetooth.cancelListenAsServer();
      Bluetooth.cancelConnectAsClient();
      Bluetooth.cancelBTConnectionThread();
      setKeySent(false);
      setKeyReceived(false);
      setOtherKey("");
    }
  },[visible])

  //navigate to createContact when keys have been exchanged
  useEffect(() => {
    if(keySentRef.current && keyReceivedRef.current) {
      navigationRef.current.navigate("editContact",{publicKey : otherKeyRef.current});
      setVisible(false);
    }
  },[keySentRef.current,keyReceivedRef.current])

  const cancel = async () => {
    await Bluetooth.cancelListenAsServer();
    await Bluetooth.cancelConnectAsClient();
    await Bluetooth.cancelBTConnectionThread();
    setVisible(false);
  }

  return (
    <CustomModal
    visible={visible}
    onRequestClose={() => setVisible(false)}
    disableOnPress>
        <View style={{...styles.modalContentContainer, width : contentWidth}}>
          <ActivityIndicator size="large" color={palette.primary} animating={loading}/>
          <Text style={{fontSize : customStyle.uiFontSize}}>{activityText}</Text>
          <CustomButton
          onPress={() => cancel()}
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
