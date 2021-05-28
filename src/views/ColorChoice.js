import React, { useState } from 'react';
import { View, Dimensions, Text, TouchableOpacity } from 'react-native';
import { ColorPicker, fromHsv, toHsv } from 'react-native-color-picker';
import Icon from 'react-native-vector-icons/MaterialIcons'

const ColorChoice = ({ title, style, setColor }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
    {open ?
    <>
    <TouchableOpacity
    style={styles.tab}
    onPress={() => setOpen(!open)}>
      <Text style={styles.title}>{title}</Text>
      <Icon style={styles.icon} name="expand-less" size={24}/>
    </TouchableOpacity>
    <View style={styles.colorPickerContainer}>
      <ColorPicker
        style={{...styles.colorPicker,...style}}
        onColorChange={color => setColor(fromHsv(color))}
      />
    </View>
    </>
    :
    <TouchableOpacity
    onPress={() => setOpen(!open)}
    style={styles.tab}>
      <Text style={{...styles.title,fontWeight : "bold"}}>{title}</Text>
      <Icon style={styles.icon} name="expand-more" size={24}/>
    </TouchableOpacity>}
    </>
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
