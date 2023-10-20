import React, { useEffect, useCallback } from 'react';
import { View, Dimensions, Text, TouchableOpacity } from 'react-native';
import { ColorPicker, fromHsv, toHsv } from 'react-native-color-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomSlider from './Slider'

import { palette } from '../assets/palette';
import { useScreenAdjustedSize } from '../helper';

const ColorChoice = ({ style, setColor, color, oldColor, containerStyle, sliderTitleSize,
                       sliderTextSize}) => {

  const pickerHeight = useScreenAdjustedSize(0.3,0.5, "height");
  const pickerWidth = useScreenAdjustedSize(0.8,0.5);

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
      rightTitleStyle={{fontSize : sliderTitleSize}}
      rightTextStyle={{fontSize : sliderTextSize}}
      containerStyle={styles.sliderContainer}
      onValueChange={props.onValueChange}/>
    )
  },[sliderTitleSize, sliderTextSize])

  return (
    <View style={{...styles.colorPickerContainer, ...containerStyle}}>
      <ColorPicker
        color={color}
        oldColor={oldColor}
        style={{
          ...styles.colorPicker,
          height : pickerHeight,
          width : pickerWidth,
          ...style,
          borderWidth : 1,
          borderColor : "red"
        }}
        sliderComponent={Slider}
        onColorChange={color => color.s === 0 ? setColor({...color,s : 0.001}) : setColor(color)}
      />
    </View>
  )
}

export default ColorChoice

const styles = {
  colorPicker : {
    maxHeight : 400,
    maxWidth : 400,
  },
  colorPickerContainer : {
    alignItems : "center",
    paddingBottom : 10,
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
