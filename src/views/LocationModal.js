import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';

import CustomModal from './CustomModal';
import CustomButton from './CustomButton';

import { palette } from '../assets/palette';

const LocationModal = ({ visible, modalOnPress, buttonOnPress, onRequestClose,
                         description, instructionText}) => {
  const customStyle = useSelector(state => state.chatReducer.styles);
  return (
    <CustomModal
    onPress={modalOnPress}
    onRequestClose={onRequestClose}
    visible={visible}>
      <View style={styles.modalContentContainer}>
        <Icon name="location-on" size={48}/>
        {!!description &&
        <Text style={{fontSize : customStyle.uiFontSize}}>
          {description}
        </Text>}

        {!!instructionText &&
        <Text style={{fontWeight : "bold", marginVertical : 20, fontSize : customStyle.uiFontSize}}>
        {instructionText}
        </Text>}

        <CustomButton
        onPress={buttonOnPress}
        text="Go To Settings"/>
      </View>
    </CustomModal>
  )
}

const styles = {
  modalContentContainer : {
    backgroundColor : palette.white,
    borderRadius : 5,
    padding : 30,
    alignItems : "center",
    maxWidth : Dimensions.get('window').width * 0.8,
    maxHeight : Dimensions.get('window').height * 0.8
  }
}

export default LocationModal;
