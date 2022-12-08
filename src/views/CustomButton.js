import React from 'react'
import { TouchableOpacity, Text, Dimensions, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const CustomButton = ({ onPress, rightIcon, rightIconSize, leftIcon, leftIconSize,
                        text, buttonStyle, textStyle, disabled}) => {
  return (
    <TouchableOpacity
    onPress={onPress}
    style={disabled ? {...styles.button,...buttonStyle, backgroundColor : "grey"} :{...styles.button,...buttonStyle}}
    disabled={disabled}>
      {leftIcon &&
      <Icon name={leftIcon} size={leftIconSize}/>}

      <Text style={{...styles.buttonText, ...textStyle}}>{text}</Text>

      {rightIcon &&
      <Icon name={rightIcon} size={rightIconSize}/>}
    </TouchableOpacity>
  )
}

const styles = {
  button : {
    backgroundColor : "#E86252",
    padding : 10,
    borderRadius : 5,
    alignSelf : "center",
    alignItems : "center",
    justifyContent : "center",
    flexDirection : "row",
    width : Dimensions.get("window").width * 0.3
  },
  buttonText : {
    color : "white",
    fontWeight : "bold",
<<<<<<< HEAD
    textAlign : "center",
    ...(Platform.OS === 'android' && {fontFamily : "Open-Sans"})
=======
    fontFamily : "Open-Sans",
    textAlign : "center",
    marginLeft : "auto",
    marginRight : "auto"
>>>>>>> master
  },
}

export default CustomButton;
