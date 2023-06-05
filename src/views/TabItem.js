import React from 'react';
import { useSelector } from 'react-redux';
import { TouchableOpacity, Text } from 'react-native';

import { palette } from '../assets/palette';

const TabItem = ({ text, containerStyle, textStyle, active, onPress}) => {
  const customStyle = useSelector(state => state.chatReducer.styles);
  return (
    <TouchableOpacity
    style={{
      ...styles.container,
      ...containerStyle,
      ...(active && styles.activeContainer)
    }}
    onPress={onPress}>
      <Text style={{
        ...styles.text,
        fontSize : customStyle.uiFontSize,
        ...textStyle,
        color : active ? palette.primary : palette.black}}>
          {text}
      </Text>
    </TouchableOpacity>
  )
}

const styles = {
  container : {
    padding : 10,
    alignItems : "center",
    justifyContent : "center"
  },
  activeContainer : {
    borderBottomWidth : 1,
    borderBottomColor : palette.primary,
  },
  text : {
    color : palette.black,
    fontWeight : "bold"
  },
}

export default TabItem;
