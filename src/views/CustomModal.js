import React from 'react';
import { Modal, TouchableOpacity, Dimensions, View } from 'react-native';

import { palette } from '../assets/palette';

const CustomModal = ({ children, visible, onPress, onRequestClose, disableOnPress,
                       animationType, transparent = true, containerStyle}) => {
  return (
    <Modal
    animationType={animationType || "fade"}
    transparent={transparent}
    onRequestClose={onRequestClose}
    visible={visible}>
      <TouchableOpacity
      disabled={disableOnPress}
      style={{...styles.modalMainContainer,...containerStyle}}
      onPress={onPress}>
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
    backgroundColor : palette.white,
    borderRadius : 5,
    padding : 20,
    alignItems : "center",
    maxWidth : Dimensions.get('window').width * 0.8,
    maxHeight : Dimensions.get('window').height * 0.8
  },
}

export default CustomModal;
