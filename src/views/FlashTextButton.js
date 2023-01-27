import React, { useState } from 'react';
import {Text, TouchableOpacity, Dimensions } from 'react-native';

import { palette } from '../assets/palette';

const FlashTextButton = ({ onPress, flashText, normalText,
                           timeout, buttonStyle, textStyle, disabled }) => {

  const [buttonText, setButtonText] = useState(normalText)

  const onButtonPress = async () => {
    const success = await onPress();
    if(success) {
      setButtonText(flashText);
      setTimeout(() => {
        setButtonText(normalText);
      },timeout)
    }
  }

  return (
    <TouchableOpacity
    disabled={disabled}
    style={disabled ? {...styles.button,...buttonStyle,backgroundColor : palette.grey} : {...styles.button,...buttonStyle}}
    onPress={onButtonPress}>
      <Text style={{...styles.buttonText,...textStyle}}>{buttonText + " "}</Text>
    </TouchableOpacity>
  )
}

const styles = {
  button : {
    backgroundColor : palette.primary,
    padding : 10,
    alignSelf : "center",
    borderRadius : 5,
    width : Dimensions.get("window").width * 0.3
  },
  buttonText : {
    color : palette.white,
    fontWeight : "bold",
    textAlign : "center"
  },
}

export default FlashTextButton;
