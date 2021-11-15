import React from 'react';
import { TouchableOpacity, Text } from 'react-native';

const TabItem = ({ text, containerStyle, textStyle, active, onPress}) => {
  return (
    <TouchableOpacity
    style={{...styles.container,...containerStyle}}
    onPress={onPress}>
      <Text style={{
        ...styles.text,
        ...textStyle,
        color : active ? "#E86252" : "black"}}>
          {text}
      </Text>
    </TouchableOpacity>
  )
}

const styles = {
  container : {
    borderRightWidth : 1,
    borderRightColor : "grey",
    padding : 10,
    alignItems : "center",
    justifyContent : "center"
  },
  text : {
    color : "black",
    fontWeight : "bold"
  },
}

export default TabItem;
