import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import CustomModal from './CustomModal';
import CustomButton from './CustomButton';

import { palette } from '../assets/palette';

const LocationModal = ({ visible, modalOnPress, buttonOnPress, onRequestClose,
                         description, instructionText}) => {
  return (
    <CustomModal
    onPress={modalOnPress}
    onRequestClose={onRequestClose}
    visible={visible}>
      <View style={styles.modalContentContainer}>
        <Icon name="location-on" size={48}/>
        <Text>
          {description}
        </Text>

        <Text style={{fontWeight : "bold", marginVertical : 20}}>
        {instructionText}
        </Text>

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
