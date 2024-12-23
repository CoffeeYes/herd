import React from 'react';
import {  Text, View } from 'react-native';
import { palette } from '../assets/palette';

import CustomModal from './CustomModal';
import CustomButton from './CustomButton';

const ConfirmationModal = ({confirmText = "Confirm", cancelText = "Cancel", onConfirm, onCancel, visible, titleText}) => {
  return (
    <CustomModal
    disableOnPress
    visible={visible}>
      <View style={styles.modalContentContainer}>
      <Text>{titleText}</Text>
      <View style={{flexDirection : "row", marginTop : 10}}>
        <CustomButton
        onPress={onConfirm}
        text={confirmText}/>
        <CustomButton
        text={cancelText}
        onPress={onCancel}/>
      </View>
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
}

export default ConfirmationModal;
