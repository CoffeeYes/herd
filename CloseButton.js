import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { palette } from './src/assets/palette';

const CloseButton = ({onPress, buttonStyle, textStyle}) => {
  return (
    <TouchableOpacity
    onPress={onPress}
    style={{...styles.button, ...buttonStyle}}>
      <Text style={{...styles.text, ...textStyle}}>X</Text>
    </TouchableOpacity>
  )
}

const styles = {
  button : {
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
  },
  text : {
    fontWeight : "bold"
  }
}

export default CloseButton;
