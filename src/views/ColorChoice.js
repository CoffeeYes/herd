import React, { useRef } from 'react';
import { View } from 'react-native';
import { ColorPicker } from 'react-native-color-picker';
import CustomSlider from './Slider'

import { palette } from '../assets/palette';
import { useScreenAdjustedSize } from '../helper';

const Slider = ({sliderTitleSize, sliderTextSize, sliderWidth, value, useValue, onValueChange}) => {
  const valueRef = useRef(value);
  return (
    <CustomSlider
    tapToSeek
    minimumTrackTintColor={palette.secondary}
    maximumTrackTintColor={palette.primary}
    thumbTintColor={palette.primary}
    rightText={value.toFixed(2)}
    sliderStyle={styles.slider}
    value={useValue ? value : valueRef.current}
    min={0.01}
    step={0.01}
    rightTitleStyle={{fontSize : sliderTitleSize}}
    rightTextStyle={{fontSize : sliderTextSize}}
    containerStyle={{...styles.sliderContainer, width : sliderWidth}}
    onValueChange={onValueChange}/>
  )
}

const ColorChoice = ({ style, setColor, color, oldColor, containerStyle, sliderTitleSize,
                       sliderTextSize, overrideSliderValues}) => {

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
      useValue={overrideSliderValues}
      value={color.s} onValueChange={value => setColor({...color, s : value})}/>
      <Slider
      {...sliderProps}
      useValue={overrideSliderValues}
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
