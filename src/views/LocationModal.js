import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import CustomModal from './CustomModal';
import CustomButton from './CustomButton';

const LocationModal = ({ visible, modalOnPress, buttonOnPress, onRequestClose}) => {
  return (
    <CustomModal
    onPress={modalOnPress}
    onRequestClose={onRequestClose}
    visible={visible}>
      <View style={styles.modalContentContainer}>
        <Icon name="location-on" size={48}/>
        <Text>
          In order to transfer messages in the background, herd requires
          location permissions to be allowed all the time.
        </Text>

        <Text style={{fontWeight : "bold", marginTop : 20}}>
        Please go into the permission settings for Herd and select "Allow all the time"
        in order to allow Herd to function correctly.
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
    backgroundColor : "white",
    borderRadius : 5,
    padding : 30,
    alignItems : "center",
    maxWidth : Dimensions.get('window').width * 0.8,
    maxHeight : Dimensions.get('window').height * 0.8
  }
}

export default LocationModal;
