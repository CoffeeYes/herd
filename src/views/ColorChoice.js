import React, { useEffect, useCallback, useRef, useState } from 'react';
import { View, Dimensions, Text, TouchableOpacity } from 'react-native';
import { ColorPicker, fromHsv, toHsv } from 'react-native-color-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomSlider from './Slider'

import { palette } from '../assets/palette';
import { useScreenAdjustedSize } from '../helper';

const Slider = ({sliderTitleSize, sliderTextSize, sliderWidth, value, onValueChange}) => {
  const [sliding, setSliding] = useState(false);
  return (
    <CustomSlider
    tapToSeek
    onSlidingStart={() => setSliding(true)}
    onSlidingComplete={val => {onValueChange(val); setSliding(false)}}
    minimumTrackTintColor={palette.secondary}
    maximumTrackTintColor={palette.primary}
    thumbTintColor={palette.primary}
    rightText={value.toFixed(2)}
    sliderStyle={styles.slider}
    {...(!sliding && {value})}
    min={0.01}
    step={0.01}
    rightTitleStyle={{fontSize : sliderTitleSize}}
    rightTextStyle={{fontSize : sliderTextSize}}
    containerStyle={{...styles.sliderContainer, width : sliderWidth}}
    onValueChange={onValueChange}/>
  )
}

const ColorChoice = ({ style, setColor, color, oldColor, containerStyle, sliderTitleSize,
                       sliderTextSize}) => {

  const pickerHeight = useScreenAdjustedSize(0.6,0.6, "height");
  const pickerWidth = useScreenAdjustedSize(0.8,0.5);
  const sliderWidth = useScreenAdjustedSize(0.8, 0.6);

  const sliderProps = {
    sliderTextSize,
    sliderTitleSize,
    sliderWidth
  }



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
        hideSliders
        onColorChange={color => setColor(color)}
      />
      <Slider
      {...sliderProps}
      value={color.s} onValueChange={value => setColor({...color, s : value})}/>
      <Slider
      {...sliderProps}
      value={color.v} onValueChange={value => setColor({...color, v : value})}/>
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
