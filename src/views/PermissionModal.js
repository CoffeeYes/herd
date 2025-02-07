import React from 'react';
import { View, ScrollView, Text } from 'react-native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';

import CustomModal from './CustomModal';
import CustomButton from './CustomButton';
import CloseButton from './CloseButton';

import { palette } from '../assets/palette';

const PermissionModal = ({ visible, modalOnPress, buttonOnPress, onRequestClose, useCloseButton=false,
                         description, instructionText, icon, iconSize = 48, permissions, disableOnPress=false}) => {

  const customStyle = useSelector(state => state.chatReducer.styles);

  return (
    <CustomModal
    onPress={modalOnPress}
    disableOnPress={disableOnPress}
    onRequestClose={onRequestClose}
    visible={visible}>
      <View style={{...styles.modalContentContainer, width : "90%", maxHeight : "90%"}}>
        <ScrollView contentContainerStyle={{alignItems : "center"}}>

          {icon &&
          <Icon name={icon} size={iconSize} style={{marginBottom : 10}}/>}

          <View>
            {description?.length > 0 &&
            <Text style={{fontSize : customStyle.scaledUIFontSize}}>
              {description}
            </Text>}

            {instructionText?.length > 0 &&
            <Text style={{fontWeight : "bold", marginVertical : 20, fontSize : customStyle.scaledUIFontSize}}>
              {instructionText}
            </Text>}
          </View>
          {permissions?.map(permission => {
            return(
              <Text key={permission} style={{fontWeight : "bold", fontSize : customStyle.scaledUIFontSize}}>
                {permission}
              </Text>
            )
          })}

          <CustomButton
          buttonStyle={{marginTop : permissions?.length > 0 ? 10 : 0}}
          onPress={buttonOnPress}
          text="Go To Settings"/>
        </ScrollView>

        {useCloseButton &&
        <CloseButton onPress={onRequestClose}/>}

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
  },
  xButton : {
    borderWidth : 1,
    borderColor : "black",
    backgroundColor : palette.primary,
    borderRadius : 25,
    width : 25,
    height : 25,
    alignItems : "center",
    justifyContent : "center",
    padding : 2,
    position : "absolute",
    right : -10,
    top : -10
  }
}

export default PermissionModal;
