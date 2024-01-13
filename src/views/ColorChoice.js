import React, { useEffect, useCallback } from 'react';
import { View, Dimensions, Text, TouchableOpacity } from 'react-native';
import { ColorPicker, fromHsv, toHsv } from 'react-native-color-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomSlider from './Slider'

import { palette } from '../assets/palette';
import { useScreenAdjustedSize } from '../helper';

const ColorChoice = ({ style, setColor, color, oldColor, containerStyle, sliderTitleSize,
                       sliderTextSize}) => {

  const pickerHeight = useScreenAdjustedSize(0.6,0.6, "height");
  const pickerWidth = useScreenAdjustedSize(0.8,0.5);
  const sliderWidth = useScreenAdjustedSize(0.8, 0.6);

  const Slider = useCallback(props => {
    return (
      <CustomSlider
      tapToSeek
      onSlidingComplete={val => props.onValueChange(val)}
      minimumTrackTintColor={palette.secondary}
      maximumTrackTintColor={palette.primary}
      thumbTintColor={palette.primary}
      rightText={props.value.toFixed(2)}
      sliderStyle={styles.slider}
      rightTitleStyle={{fontSize : sliderTitleSize}}
      rightTextStyle={{fontSize : sliderTextSize}}
      containerStyle={{...styles.sliderContainer, width : sliderWidth}}
      onValueChange={props.onValueChange}/>
    )
  },[sliderTitleSize, sliderTextSize, sliderWidth])

  return (
    <View style={{...styles.colorPickerContainer, ...containerStyle}}>
      <ColorPicker
        color={color}
        oldColor={oldColor}
        style={{
          height : pickerHeight,
          width : pickerWidth,
          ...style
        }}
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
    justifyContent : "center",
    paddingBottom : 10,
  },
  slider : {
      flex : 1,
  },
  sliderContainer : {
    alignItems : "center",
    alignSelf : "center",
    flexDirection : "row",
    marginHorizontal : 10,
    backgroundColor : palette.white,
    marginVertical : 10,
  }
}
