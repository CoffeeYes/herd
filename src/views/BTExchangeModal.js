import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import Bluetooth from '../nativeWrapper/Bluetooth';

const BTExchangeModal = ({ visible, setVisible}) => {
  const [loading, setLoading] = useState(true);
  const [activityText, setActivityText] = useState("Waiting On Other Device")

  const cancel = async () => {
    await Bluetooth.cancelListenAsServer();
    setVisible(false);
  }

  return (
    <Modal
    animationType="slide"
    transparent={true}
    visible={visible}>
      <View style={styles.modalMainContainer}>
        <View style={styles.modalContentContainer}>
          {loading && <ActivityIndicator size="large" color="#e05e3f"/>}
          <Text>{activityText}</Text>
          <TouchableOpacity
          style={styles.button}
          onPress={cancel}>
          <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const styles = {
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
  modalMainContainer : {
    alignItems : "center",
    justifyContent : "center",
    flex : 1,
    backgroundColor : "rgba(0,0,0,0.4)"
  },
  modalContentContainer : {
    backgroundColor : "white",
    borderRadius : 5,
    padding : 20,
    alignItems : "center"
  }
}

export default BTExchangeModal;
