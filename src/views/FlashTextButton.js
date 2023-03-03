import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {Text, TouchableOpacity, Dimensions } from 'react-native';

import { palette } from '../assets/palette';

const FlashTextButton = ({ onPress, flashText, normalText,
                           timeout, buttonStyle, textStyle, disabled,
                           disabledStyle }) => {
  const customStyle = useSelector(state => state.chatReducer.styles);
  const [buttonText, setButtonText] = useState(normalText)

  const onButtonPress = async () => {
    const success = await onPress();
    if(success && timeout > 0) {
      setButtonText(flashText);
      setTimeout(() => {
        setButtonText(normalText);
      },timeout)
    }
  }

  return (
    <TouchableOpacity
    disabled={disabled}
    style={{
      ...styles.button,
      ...buttonStyle,
      ...(disabled && {...styles.disabled,...disabledStyle})
    }}
    onPress={onButtonPress}>
      <Text style={{...styles.buttonText,fontSize : customStyle.uiFontSize,...textStyle}}>
        {buttonText + " "}
      </Text>
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
  disabled : {
    backgroundColor : palette.grey
  }
}

export default FlashTextButton;
