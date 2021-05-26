import React, { useState } from 'react';
import { View, Dimensions } from 'react-native';
import { ColorPicker, fromHsv, toHsv } from 'react-native-color-picker';

const ColorChoice = ({ style, color, setColor }) => {

  return (
    <View style={styles.colorPickerContainer}>
      <ColorPicker
      style={{...styles.colorPicker,...style}}
      color={() => toHsv(color)}
      onColorChange={color => setColor(fromHsv(color))}
      />
    </View>
  )
}

export default ColorChoice

const styles = {
  colorPickerContainer : {
    alignItems : "center"
  },
  colorPicker : {
    width : Dimensions.get("window").width * 0.8,
    height : Dimensions.get("window").height * 0.5
  }
}
