import React  from 'react';
import { View } from 'react-native';
import { ColorPicker } from 'react-native-color-picker';

import ValueSlider from './ValueSlider';

import { palette } from '../assets/palette';
import { useScreenAdjustedSize } from '../helper';

const ColorChoice = ({ style, setColor, color, oldColor, containerStyle, sliderTitleSize,
                       sliderTextSize, overrideSliderValues}) => {

  const pickerHeight = useScreenAdjustedSize(0.6,0.6, "height");
  const pickerWidth = useScreenAdjustedSize(0.8,0.5);
  const sliderWidth = useScreenAdjustedSize(0.8, 0.6);

  const sliderProps = {
    min : 0.01,
    step : 0.01,
    max : 1,
    useValue : overrideSliderValues,
    containerStyle : {...styles.sliderContainer, width : sliderWidth},
    rightTitleStyle : {fontSize : sliderTitleSize},
    rightTextStyle : {fontSize : sliderTextSize},
    sliderStyle : styles.slider
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
      <ValueSlider
      {...sliderProps}
      rightText={color.s.toFixed(2)}
      value={color.s} 
      onValueChange={value => setColor({...color, s : value})}
      />
      <ValueSlider
      {...sliderProps}
      rightText={color.v.toFixed(2)}
      value={color.v} 
      onValueChange={value => setColor({...color, v : value})}
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
