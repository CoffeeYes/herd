import React from 'react';
import { Modal, TouchableOpacity, Dimensions, View } from 'react-native';

import { palette } from '../assets/palette';

const CustomModal = ({ children, visible, onPress, onRequestClose, disableOnPress,
                       animationType = "fade", transparent = true, containerStyle}) => {
  return (
    <Modal
    animationType={animationType}
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
  }
}

export default CustomModal;
