import React, { useState } from 'react';
import { View, TouchableOpacity, Text, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const CardButton = ({ onPress, text, rightIcon, iconSize, iconStyle,
                      containerStyle, textStyle, flashText, timeout }) => {
  const [currentText, setCurrentText] = useState(text);

  const flash = () => {
    onPress();
    setCurrentText(flashText);
    setTimeout(() => {
      setCurrentText(text);
    },timeout)
  }

  return (
    <TouchableOpacity
    style={{...styles.container,...containerStyle}}
    onPress={(flashText && timeout) ? flash : onPress}>
      <Text style={{...styles.text,...textStyle}}>{currentText}</Text>
      <Icon
      style={{...iconStyle, marginLeft : "auto"}}
      name={rightIcon}
      size={iconSize || 32}/>
    </TouchableOpacity>
  )
}

const styles = {
  container : {
    flexDirection : "row",
    justifyContent : "space-around",
    alignItems : "center",
    width : Dimensions.get('window').width * 0.9,
    padding : 20,
    borderRadius : 10,
    backgroundColor : "white",
    elevation : 2,
    marginVertical : 5
  },
  text : {
    marginLeft : "auto",
    marginRight : "auto",
    fontWeight : "bold",
    fontSize : 16
  }
}

export default CardButton
