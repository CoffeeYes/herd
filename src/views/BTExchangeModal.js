import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import Bluetooth from '../nativeWrapper/Bluetooth';
import CustomModal from './CustomModal';
import CustomButton from './CustomButton';

const BTExchangeModal = ({ visible, setVisible}) => {
  const [loading, setLoading] = useState(true);
  const [activityText, setActivityText] = useState("Waiting On Other Device")

  const cancel = async () => {
    await Bluetooth.cancelListenAsServer();
    await Bluetooth.cancelConnectAsClient();
    setVisible(false);
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
