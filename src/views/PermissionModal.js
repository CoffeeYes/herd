import React from 'react';
import { View, ScrollView, Text, Dimensions } from 'react-native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';

import CustomModal from './CustomModal';
import CustomButton from './CustomButton';

import { palette } from '../assets/palette';

import { useScreenAdjustedSize } from '../helper';

const LocationModal = ({ visible, modalOnPress, buttonOnPress, onRequestClose,
                         description, instructionText, icon, iconSize = 48, permissions}) => {
  const customStyle = useSelector(state => state.chatReducer.styles);
  const containerWidth = useScreenAdjustedSize(0.9,0.9);
  const screenHeight = useScreenAdjustedSize(1,1,"height");
  return (
    <CustomModal
    onPress={modalOnPress}
    onRequestClose={onRequestClose}
    visible={visible}>
      <View style={{...styles.modalContentContainer, width : containerWidth, maxHeight : screenHeight * 0.9}}>
        <ScrollView contentContainerStyle={{alignItems : "center"}}>
        {icon &&
        <Icon name={icon} size={iconSize}/>}

        {description?.length > 0 &&
        <Text style={{fontSize : customStyle.uiFontSize}}>
          {description}
        </Text>}

        {instructionText?.length > 0 &&
        <Text style={{fontWeight : "bold", marginVertical : 20, fontSize : customStyle.uiFontSize}}>
          {instructionText}
        </Text>}

        {permissions?.map(permission => {
          return(
            <Text key={permission} style={{fontWeight : "bold", fontSize : customStyle.uiFontSize}}>{permission}</Text>
          )
        })}

        <CustomButton
        buttonStyle={{marginTop : 20}}
        onPress={buttonOnPress}
        text="Go To Settings"/>
        </ScrollView>
      </View>
    </CustomModal>
  )
}

const styles = {
  modalContentContainer : {
    backgroundColor : palette.white,
    borderRadius : 5,
    padding : 30,
    alignItems : "center"
  }
}

export default LocationModal;
