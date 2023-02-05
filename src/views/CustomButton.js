import React from 'react'
import { TouchableOpacity, Text, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { palette } from '../assets/palette';

const CustomButton = ({ onPress, rightIcon, rightIconSize, leftIcon, leftIconSize,
                        text, buttonStyle, textStyle, disabled}) => {
  return (
    <TouchableOpacity
    onPress={onPress}
    style={{
      ...styles.button,
      ...buttonStyle,
      ...(disabled && {backgroundColor : palette.grey})
    }}
    disabled={disabled}>
      {leftIcon &&
      <Icon name={leftIcon} size={leftIconSize}/>}

      {text &&
      <Text style={{...styles.buttonText, ...textStyle}}>{text}</Text>}

      {rightIcon &&
      <Icon name={rightIcon} size={rightIconSize}/>}
    </TouchableOpacity>
  )
}

const styles = {
  button : {
    backgroundColor : palette.primary,
    padding : 10,
    borderRadius : 5,
    alignSelf : "center",
    alignItems : "center",
    justifyContent : "center",
    flexDirection : "row",
    width : Dimensions.get("window").width * 0.3,
    borderWidth : 1,
    borderColor : palette.white
  },
  buttonText : {
    color : palette.white,
    fontWeight : "bold",
    fontFamily : "Open-Sans",
    textAlign : "center",
    marginLeft : "auto",
    marginRight : "auto"
  },
}

export default CustomButton;
