import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { View, Text, NativeEventEmitter, Platform } from 'react-native';
import Bluetooth from '../nativeWrapper/Bluetooth';
import ServiceInterface from '../nativeWrapper/ServiceInterface';
import CustomModal from './CustomModal';
import CustomButton from './CustomButton';
import EventEmitter from '../nativeWrapper/EventEmitter';

import { palette } from '../assets/palette';
import { useOrientationBasedStyle, useStateAndRef } from '../helper';
import LoadingIndicator from './LoadingIndicator';

const activityStateText = {
  waiting :  "Waiting On Other Device",
  [Bluetooth.bluetoothStates.STATE_CONNECTED]: "Connected, Waiting for Data",
  [Bluetooth.bluetoothStates.STATE_DISCONNECTED]: "Disconnected"
};

const BTExchangeModal = ({ onRequestClose, onCancel, onSuccess}) => {
  const [loading, setLoading] = useState(true);
  const [activityText, setActivityText] = useState(activityStateText.waiting);
  const [receivedKey, setReceivedKey] = useState("");
  const [keySent, setKeySent] = useState(false);
  const [error, setError, errorRef] = useStateAndRef("");

  const customStyle = useSelector(state => state.appStateReducer.styles);

  const contentWidth = useOrientationBasedStyle({width : "80%"},{width : "60%"});

  useEffect(() => {
    const eventEmitter = new NativeEventEmitter(Platform.OS == "ios" ? EventEmitter : Bluetooth);
    const serviceEventEmitter = new NativeEventEmitter(Platform.OS == "ios" ? EventEmitter : ServiceInterface)

    //listen for connected state to begin key exchange
    const stateChangeListener = eventEmitter.addListener(Bluetooth.emitterStrings.CONNECTION_STATE_CHANGE, async state => {
      setActivityText(activityStateText[state] || activityStateText.waiting);
      if (state === Bluetooth.bluetoothStates.STATE_DISCONNECTED) {
        setLoading(false);
        cancelBluetoothActions();
      }
    })

    const bluetoothAndLocationStateListener = serviceEventEmitter.addListener(ServiceInterface.emitterStrings.BLUETOOTH_LOCATION_STATE_CHANGE, state => {
      let disableType = "";
      if(state === ServiceInterface.bluetoothErrors.ADAPTER_TURNED_OFF) {
        disableType = "Bluetooth";
      }
      else if(state === ServiceInterface.bluetoothErrors.LOCATION_DISABLED) {
        disableType = "Location";
      }

      if(errorRef.current.length == 0 && disableType.length > 0) {
        setError(`${disableType} was disabled`)
      }
    })

    //listen for messages to receive keys and ACKS
    const messageListener = eventEmitter.addListener(Bluetooth.emitterStrings.NEW_DATA_FROM_CONNECTION, msg => {
      try {
        const message = JSON.parse(msg);
        if(message?.key) {
          setReceivedKey(message.key);
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
      bluetoothAndLocationStateListener.remove();
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

  }

  return (
    <CustomModal
    onRequestClose={onRequestClose}
    disableOnPress>
      <View style={{...styles.modalContentContainer, ...contentWidth}}>
        {error.length == 0 ?
        <>
          <LoadingIndicator animating={loading}/>
          <Text style={{fontSize : customStyle.scaledUIFontSize}}>{activityText}</Text>
        </>
        :
        <>
          <Text style={{...styles.errorText, fontSize : customStyle.scaledUIFontSize}}>{`${error}, Please try again`}</Text>
        </>}
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
  },
  errorText : {
    fontWeight : "bold",
    color : palette.red
  }
}

export default BTExchangeModal;
