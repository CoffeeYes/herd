import React from 'react';
import { TouchableOpacity, Text } from 'react-native';

import { palette } from '../assets/palette';

const TabItem = ({ text, containerStyle, textStyle, active, onPress}) => {
  return (
    <TouchableOpacity
    style={{...styles.container,...containerStyle}}
    onPress={onPress}>
      <Text style={{
        ...styles.text,
        ...textStyle,
        color : active ? palette.primary : palette.black}}>
          {text}
      </Text>
    </TouchableOpacity>
  )
}

const styles = {
  container : {
    borderRightWidth : 1,
    borderRightColor : palette.grey,
    padding : 10,
    alignItems : "center",
    justifyContent : "center"
  },
  text : {
    color : palette.black,
    fontWeight : "bold"
  },
}

export default TabItem;
