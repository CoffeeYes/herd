import React, { useState } from 'react';
import { View, TouchableOpacity, Text, Dimensions } from 'react-native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { palette } from '../assets/palette';

const CardButton = ({ onPress, text, rightIcon, flashIcon, iconSize, iconStyle, iconContainerStyle,
                      containerStyle, textStyle, textContainerStyle, flashText, timeout, disableTouch }) => {
  const customStyle = useSelector(state => state.chatReducer.styles)
  const [currentText, setCurrentText] = useState(text);
  const [displayedIcon, setDisplayedIcon] = useState(rightIcon);

  const flash = async () => {
    const success = await onPress();
    if(success && flashText?.length > 0 && timeout > 0) {
      setCurrentText(flashText);
      flashIcon?.length > 0 && setDisplayedIcon(flashIcon);
      setTimeout(() => {
        setCurrentText(text);
        setDisplayedIcon(rightIcon);
      },timeout)
    }
  }

  return (
    <TouchableOpacity
    disabled={disableTouch}
    style={{...styles.container,...containerStyle}}
    onPress={flash}>

      {currentText?.length > 0 &&
      <View style={{...styles.textContainer, ...textContainerStyle}}>
        <Text style={{
        ...styles.text,
        fontSize : customStyle.scaledUIFontSize,
        ...textStyle}}>
          {currentText}
        </Text>
      </View>}

      {rightIcon &&
      <View style={{...styles.iconContainer,...iconContainerStyle}}>
        <Icon
        style={{...styles.icon, ...iconStyle}}
        name={displayedIcon}
        size={iconSize || customStyle.scaledUIFontSize}/>
      </View>}

    </TouchableOpacity>
  )
}

const styles = {
  container : {
    flexDirection : "row",
    justifyContent : "space-around",
    alignItems : "center",
    width : "90%",
    padding : 20,
    borderRadius : 10,
    backgroundColor : palette.white,
    elevation : 2,
    marginVertical : 5
  },
  text : {
    fontWeight : "bold",
    fontSize : 16
  },
  textContainer : {
    marginLeft : "auto",
    marginRight : "auto",
    flexDirection : "row",
    justifyContent : "flex-start",
    width : "60%",
  },
  iconContainer : {
    justifyContent : "center"
  },
  icon : {
    alignSelf : "flex-end"
  },
}

export default CardButton
