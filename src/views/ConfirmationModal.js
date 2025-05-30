import React from 'react';
import { useSelector } from 'react-redux';
import {  Text, View } from 'react-native';
import { palette } from '../assets/palette';

import CustomModal from './CustomModal';
import CustomButton from './CustomButton';
import LoadingIndicator from './LoadingIndicator';

const ConfirmationModal = ({
  confirmText = "Confirm", cancelText = "Cancel", 
  onConfirm, onCancel, visible, titleText,
  loading}) => {

  const customStyle = useSelector(state => state.appStateReducer.styles);
  return (
    <CustomModal
    disableOnPress
    visible={visible}>
      <View style={styles.modalContentContainer}>
      {loading &&
      <LoadingIndicator/>
      }
      <Text style={{fontSize : customStyle.scaledUIFontSize}}>{titleText}</Text>
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
