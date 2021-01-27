import React from 'react';
import { View, Text, Modal, TouchableOpacity, ActivityIndicator} from 'react-native';

const ConfirmModal = ({ header, visible, setVisible, onConfirm, loading}) => {
  return (
    <Modal
    animationType="slide"
    transparent={true}
    visible={visible}>
      <View style={styles.modalMainContainer}>
        <View style={styles.modalContentContainer}>
          <Text>{header}</Text>
          {loading && <ActivityIndicator size="large" color="#e05e3f"/>}
          <View style={{flexDirection : "row"}}>
            <TouchableOpacity
            style={styles.button}
            onPress={onConfirm}>
              <Text style={styles.buttonText}>Yes</Text>
            </TouchableOpacity>
            <TouchableOpacity
            style={styles.button}
            onPress={() => setVisible(false)}>
              <Text style={styles.buttonText}>No</Text>
            </TouchableOpacity>
          </View>
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
    textAlign : "center"
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

export default ConfirmModal;
