import React from 'react';
import { useSelector } from 'react-redux';
import { TouchableOpacity, Text, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { palette } from '../assets/palette';

const CustomButton = ({ onPress, rightIcon, rightIconSize = 24, leftIcon, leftIconSize,
                        text, buttonStyle, textStyle, disabled, disabledStyle}) => {
  const customStyle = useSelector(state => state.chatReducer.styles);
  return (
    <TouchableOpacity
    onPress={onPress}
    style={{
      ...styles.button,
      ...buttonStyle,
      ...(disabled && {...styles.disabled,...disabledStyle})
    }}
    disabled={disabled}>
      {leftIcon &&
      <Icon name={leftIcon} size={leftIconSize}/>}

      {text &&
      <Text style={{...styles.buttonText,fontSize : customStyle.uiFontSize, ...textStyle}}>
        {text}
      </Text>}

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
  disabled : {
    backgroundColor : palette.grey,
    borderColor : palette.grey
  }
}

export default CustomButton;
