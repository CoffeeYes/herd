import React from 'react';
import { View, Dimensions, Text, TouchableOpacity } from 'react-native';
import { ColorPicker, fromHsv, toHsv } from 'react-native-color-picker';
import Icon from 'react-native-vector-icons/MaterialIcons'

const ColorChoice = ({ title, style, setColor, defaultColor }) => {

  return (
    <View style={styles.colorPickerContainer}>
      <ColorPicker
        defaultColor={defaultColor}
        style={{...styles.colorPicker,...style}}
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
