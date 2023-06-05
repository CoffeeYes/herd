import React, { useEffect, useCallback } from 'react';
import { View, Dimensions, Text, TouchableOpacity } from 'react-native';
import { ColorPicker, fromHsv, toHsv } from 'react-native-color-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomSlider from './Slider'

import { palette } from '../assets/palette';

const ColorChoice = ({ style, setColor, color, oldColor }) => {

  const Slider = useCallback(props => {
    return (
      <CustomSlider
      tapToSeek
      onSlidingComplete={val => props.onValueChange(val)}
      minimumTrackTintColor={palette.secondary}
      maximumTrackTintColor={palette.primary}
      thumbTintColor={palette.primary}
      rightText={props.value.toFixed(2)}
      value={props.value}
      sliderStyle={styles.slider}
      containerStyle={styles.sliderContainer}
      onValueChange={props.onValueChange}/>
    )
  },[])

  return (
    <View style={styles.colorPickerContainer}>
      <ColorPicker
        color={color}
        oldColor={oldColor}
        style={{...styles.colorPicker,...style}}
        sliderComponent={Slider}
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
  },
  slider : {
      flex : 1,
  },
  sliderContainer : {
    alignItems : "center",
    flexDirection : "row",
    marginHorizontal : 10,
    backgroundColor : palette.white,
    marginVertical : 10,
  }
}
