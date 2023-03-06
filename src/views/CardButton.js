import React, { useState } from 'react';
import { View, TouchableOpacity, Text, Dimensions } from 'react-native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { palette } from '../assets/palette';

const CardButton = ({ onPress, text, rightIcon, iconSize, iconStyle, iconContainerStyle,
                      containerStyle, textStyle, flashText, timeout }) => {
  const customStyle = useSelector(state => state.chatReducer.styles)
  const [currentText, setCurrentText] = useState(text);

  const flash = async () => {
    const success = await onPress();
    if(success) {
      setCurrentText(flashText);
      setTimeout(() => {
        setCurrentText(text);
      },timeout)
    }
  }

  return (
    <TouchableOpacity
    style={{...styles.container,...containerStyle}}
    onPress={(flashText && timeout) ? flash : onPress}>

      {currentText &&
      <View style={styles.textContainer}>
        <Text style={{
        ...styles.text,
        fontSize : customStyle.uiFontSize,
        ...textStyle}}>
          {currentText}
        </Text>
      </View>}

      {rightIcon &&
      <View style={{...styles.iconContainer,...iconContainerStyle}}>
        <Icon
        style={{...styles.icon, ...iconStyle}}
        name={rightIcon}
        size={iconSize || customStyle.uiFontSize + 16}/>
      </View>}

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
    width : Dimensions.get('window').width * 0.4,
  },
  iconContainer : {
    justifyContent : "center"
  },
  icon : {
    alignSelf : "flex-end"
  },
}

export default CardButton
