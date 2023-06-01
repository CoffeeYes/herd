import React, { useEffect, useCallback } from 'react';
import { View, Dimensions, Text, TouchableOpacity } from 'react-native';
import { ColorPicker, fromHsv, toHsv } from 'react-native-color-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Slider from '@react-native-community/slider';

import { palette } from '../assets/palette';

const ColorChoice = ({ style, setColor, color, oldColor }) => {

  //useCallback necessary because passing just the custom slider
  //causes the slider to stutter and not function correctly
  const CustomSlider = useCallback(props => {
    return (
      <Slider
      minimumTrackTintColor={palette.secondary}
      maximumTrackTintColor={palette.primary}
      thumbTintColor={palette.primary}
      {...props}/>
    )
  },[])

  return (
    <View style={styles.colorPickerContainer}>
      <ColorPicker
        color={color}
        oldColor={oldColor}
        style={{...styles.colorPicker,...style}}
        sliderComponent={CustomSlider}
        onColorChange={color => color.s === 0 ? setColor({...color,s : 0.001}) : setColor(color)}
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
    backgroundColor : palette.white,
    paddingVertical : 20,
    flexDirection : "row"
  },
  icon : {
    marginRight : 10
  },
  error : {
    fontWeight : "bold",
    color : palette.red,
    marginTop : 10
  }
}
