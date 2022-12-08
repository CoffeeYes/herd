import React, { useState } from 'react';
import { View, TouchableOpacity, Text, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const CardButton = ({ onPress, text, rightIcon, iconSize, iconStyle,
                      containerStyle, textStyle, flashText, timeout }) => {
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
      <View style={styles.textContainer}>
        <Text style={{...styles.text,...textStyle}}>{currentText}</Text>
      </View>
      <Icon
      style={{...styles.icon, ...iconStyle}}
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
  icon : {
    alignSelf : "flex-end"
  }
}

export default CardButton
