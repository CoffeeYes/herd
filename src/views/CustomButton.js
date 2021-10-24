import React from 'react'
import { TouchableOpacity, Text, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const CustomButton = ({ onPress, rightIcon, leftIcon, text, buttonStyle,
                        textStyle}) => {
  return (
    <TouchableOpacity onPress={onPress} style={{...styles.button,...buttonStyle}}>
      {leftIcon &&
      <Icon name={leftIcon}/>}

      <Text style={{...styles.buttonText, ...textStyle}}>{text}</Text>

      {rightIcon &&
      <Icon name={rightIcon}/>}
    </TouchableOpacity>
  )
}

const styles = {
  button : {
    backgroundColor : "#E86252",
    padding : 10,
    marginTop : 10,
    borderRadius : 5,
    alignSelf : "center",
    alignItems : "center",
    width : Dimensions.get("window").width * 0.3
  },
  buttonText : {
    color : "white",
    fontWeight : "bold",
    fontFamily : "Open-Sans",
    textAlign : "center"
  },
}

export default CustomButton;
