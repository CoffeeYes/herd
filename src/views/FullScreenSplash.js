import React from 'react';
import { View, Text } from 'react-native';

import { palette } from '../assets/palette';

const FullScreenSplash = ({ children, title, titleStyle, containerStyle }) => {
  return (
    <View style={{...styles.container, ...containerStyle}}>
      <Text style={{...styles.text, ...titleStyle}}>{title}</Text>
      {children}
    </View>
  )
}

const styles = {
  container : {
    flex : 1,
    alignItems : "center",
    justifyContent : "center"
  },
  text : {
    fontSize : 48
  }
}

export default FullScreenSplash;
