import React from 'react';
import { Modal, TouchableOpacity, Dimensions } from 'react-native';

const CustomModal = ({ children, visible, setVisible }) => {
  return (
    <Modal
    animationType="fade"
    transparent={true}
    onRequestClose={() => setVisible(false)}
    visible={visible}>
      <TouchableOpacity
      style={styles.modalMainContainer}
      onPress={() => setVisible(false)}>
        {children} 
      </TouchableOpacity>
    </Modal>
  )
}

const styles = {
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
    alignItems : "center",
    maxWidth : Dimensions.get('window').width * 0.8,
    maxHeight : Dimensions.get('window').height * 0.8
  },
}

export default CustomModal;
