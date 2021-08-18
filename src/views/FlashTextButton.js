import React, { useState } from 'react';
import {Text, TouchableOpacity } from 'react-native';

const FlashTextButton = ({ onPress, flashText, normalText,
                           timeout, buttonStyle, textStyle }) => {

  const [buttonText, setButtonText] = useState(normalText)

  const onButtonPress = () => {
    onPress();
    setButtonText(flashText);
    setTimeout(() => {
      setButtonText(normalText);
    },timeout)
  }

  return (
    <TouchableOpacity
    style={{...styles.button,...buttonStyle}}
    onPress={onButtonPress}>
      <Text style={{...styles.buttonText,...textStyle}}>{buttonText}</Text>
    </TouchableOpacity>
  )
}

const styles = {
  button : {
    backgroundColor : "#E86252",
    padding : 10,
    alignSelf : "center",
    marginTop : 10,
    borderRadius : 5
  },
  buttonText : {
    color : "white",
    fontWeight : "bold",
    textAlign : "center"
  },
}

export default FlashTextButton;
