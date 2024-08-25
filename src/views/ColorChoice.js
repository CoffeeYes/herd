import React  from 'react';
import { View } from 'react-native';
import { fromHsv } from 'react-native-color-picker';

import ValueSlider from './ValueSlider';

import { palette } from '../assets/palette';
import { useScreenAdjustedSize } from '../helper';

const ColorChoice = ({ style, setColor, color, oldColor, containerStyle, sliderTitleSize,
                       sliderTextSize, overrideSliderValues}) => {
  
  const circleWidth = useScreenAdjustedSize(0.4,0.2,"width")
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

  const rainbowGradientPoints = Array.from(Array(36).keys()).map(value => ({
    color : fromHsv({h : value * 10, s : 1, v : 1}),
    opacity : 1
  }))

  return (
    <View style={{...styles.colorPickerContainer, ...containerStyle}}>
      <View style={{...styles.circleContainer,...style}}>
        <View style={{...styles.semiCircle, 
          width : circleWidth / 2, 
          height : circleWidth, 
          borderTopLeftRadius : circleWidth / 2, 
          borderBottomLeftRadius: circleWidth / 2, 
          backgroundColor : fromHsv(oldColor)}
        }/>
        <View style={{...styles.semiCircle, 
          width : circleWidth / 2, 
          height : circleWidth, 
          borderTopRightRadius : circleWidth / 2, 
          borderBottomRightRadius : circleWidth / 2, 
          backgroundColor : fromHsv(color)}
        }/>
      </View>
      <ValueSlider
      {...sliderProps}
      min={0}
      max={360}
      step={1}
      rightTitle={"Hue"}
      rightText={color.h.toFixed(0)}
      showColorPreview
      previewGradientPoints={rainbowGradientPoints}
      value={color.h}
      onValueChange={value => setColor({...color, h : value})}
      />
      <ValueSlider
      {...sliderProps}
      sliderStyle={{marginTop : 10}}
      showColorPreview
      previewGradientPoints={[
        {
          color : fromHsv({...color, s : 0}),
          opacity : 1
        },
        {
          color : fromHsv({...color, s : 1}),
          opacity : 1
        },
      ]}
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
      previewGradientPoints={[
        {
          color : fromHsv({...color, v : 0}),
          opacity : 1
        },
        {
          color : fromHsv({...color, v : 1}),
          opacity : 1
        },
      ]}
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
    paddingVertical : 10,
  },
  sliderContainer : {
    alignItems : "center",
    alignSelf : "center",
    flexDirection : "row",
    marginHorizontal : 10,
    backgroundColor : palette.white,
    marginVertical : 10,
  },
  circleContainer : {
    flexDirection : "row",
    alignSelf : "center",
  },
}
