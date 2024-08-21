import React  from 'react';
import { View } from 'react-native';
import { ColorPicker, fromHsv } from 'react-native-color-picker';
import GradientLine from './GradientLine';

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
    rightTitleStyle : {fontWeight : "bold", fontSize : sliderTitleSize},
    rightTextStyle : {fontSize : sliderTextSize}
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
      />
      <ValueSlider
      {...sliderProps}
      min={0}
      max={360}
      step={1}
      rightTitle={"Hue"}
      rightText={color.h}
      value={color.h}
      onValueChange={value => setColor({...color, h : value})}
      />
      <ValueSlider
      {...sliderProps}
      sliderStyle={{marginTop : 10}}
      showColorPreview
      previewGradientStart={fromHsv({...color, s : 0})}
      previewGradientEnd={fromHsv({...color, s : 1})}
      rightTitle="Sat."
      rightText={color.s.toFixed(2)}
      minimumTrackTintColor={fromHsv({...color,s : 0})}
      maximumTrackTintColor={fromHsv({...color,s : 1})}
      value={color.s} 
      onValueChange={value => setColor({...color, s : value})}
      />
      <ValueSlider
      {...sliderProps}
      sliderStyle={{marginTop : 10}}
      showColorPreview
      previewGradientStart={fromHsv({...color, v : 0})}
      previewGradientEnd={fromHsv({...color, v : 1})}
      rightTitle="Val."
      rightText={color.v.toFixed(2)}
      minimumTrackTintColor={fromHsv({...color,v : 0})}
      maximumTrackTintColor={fromHsv({...color,v : 1})}
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
  sliderContainer : {
    alignItems : "center",
    alignSelf : "center",
    flexDirection : "row",
    marginHorizontal : 10,
    backgroundColor : palette.white,
    marginVertical : 10,
  }
}
