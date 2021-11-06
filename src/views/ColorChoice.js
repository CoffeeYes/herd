import React from 'react';
import { View, Dimensions, Text, TouchableOpacity } from 'react-native';
import { ColorPicker, fromHsv, toHsv } from 'react-native-color-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Slider from '@react-native-community/slider';

const ColorChoice = ({ title, style, setColor, color, oldColor }) => {

  return (
    <View style={styles.colorPickerContainer}>
      <ColorPicker
        color={color}
        oldColor={oldColor}
        style={{...styles.colorPicker,...style}}
        onColorChange={color => setColor(color)}
      />
    </View>
  )
}

export default ColorChoice

const styles = {
  colorPickerContainer : {
    alignItems : "center",
    paddingBottom : 10
  },
  colorPicker : {
    width : Dimensions.get("window").width * 0.8,
    height : Dimensions.get("window").height * 0.5
  },
  tab : {
    alignItems : "center",
    justifyContent : "center",
    backgroundColor : "white",
    paddingVertical : 20,
    flexDirection : "row"
  },
  title : {
    marginLeft : "auto",
    marginRight : "auto"
  },
  icon : {
    marginRight : 10
  }
}
