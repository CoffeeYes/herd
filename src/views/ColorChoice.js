import React, { useMemo }  from 'react';
import { View } from 'react-native';

import ValueSlider from './ValueSlider';

import { palette } from '../assets/palette';
import { useScreenAdjustedSize, fromHsv } from '../helper';

const ColorChoice = ({ style, onColorChange, color, oldColor, containerStyle, sliderTitleSize,
                       sliderTextSize, overrideSliderValues}) => {
  
  const circleWidth = useScreenAdjustedSize(0.4,0.2,"width")
  const sliderWidth = useScreenAdjustedSize(0.8, 0.6);

  const sliderProps = {
    minimumValue : 0.01,
    step : 0.01,
    maximumValue : 1,
    useValue : overrideSliderValues,
    containerStyle : {...styles.sliderContainer, width : sliderWidth},
    rightTitleStyle : {fontWeight : "bold", fontSize : sliderTitleSize},
    rightTextStyle : {fontSize : sliderTextSize}
  }

  const rainbowGradientPoints = useMemo(() => Array.from(Array(36).keys()).map(value => ({
    color : fromHsv({h : value * 10, s : 1, v : 1}),
    opacity : 1
  })),[]);

  const saturationGradientPoints = useMemo(() => {
    return [
        {
          color : fromHsv({...color, s : 0}),
          opacity : 1
        },
        {
          color : fromHsv({...color, s : 1}),
          opacity : 1
        },
      ]
  },[color.v,color.h])
  
  const valueGradientPoints = useMemo(() => {
    return [
        {
          color : fromHsv({...color, v : 0}),
          opacity : 1
        },
        {
          color : fromHsv({...color, v : 1}),
          opacity : 1
        },
      ]
  },[color.s,color.h])

  return (
    <View style={{...styles.colorPickerContainer, ...containerStyle}}>
      <View style={{...styles.circleContainer,...style}}>
        <View style={{...styles.semiCircle, 
          width : circleWidth / 2, 
          height : circleWidth, 
          borderTopLeftRadius : circleWidth / 2, 
          borderBottomLeftRadius: circleWidth / 2, 
          backgroundColor : oldColor}
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
      minimumValue={0}
      maximumValue={360}
      step={1}
      rightTitle={"Hue"}
      rightText={color.h.toFixed(0)}
      showColorPreview
      previewGradientPoints={rainbowGradientPoints}
      value={color.h}
      minimumTrackTintColor={fromHsv({...color, s : 1, v : 1})}
      maximumTrackTintColor={fromHsv({...color, s : 1, v : 1})}
      onValueChange={value => onColorChange({...color, h : value})}
      />
      <ValueSlider
      {...sliderProps}
      sliderStyle={{marginTop : 10}}
      showColorPreview
      previewGradientPoints={saturationGradientPoints}
      rightTitle="Sat."
      rightText={color.s.toFixed(2)}
      minimumTrackTintColor={fromHsv({...color,s : 1})}
      maximumTrackTintColor={fromHsv({...color,s : 1})}
      value={parseFloat(color.s.toFixed(2))} 
      onValueChange={value => onColorChange({...color, s : parseFloat(value.toFixed(2))})}
      />
      <ValueSlider
      {...sliderProps}
      sliderStyle={{marginTop : 10}}
      showColorPreview
      previewGradientPoints={valueGradientPoints}
      rightTitle="Val."
      rightText={color.v.toFixed(2)}
      minimumTrackTintColor={fromHsv({...color,v : 0.5})}
      maximumTrackTintColor={fromHsv({...color,v : 0.5})}
      value={parseFloat(color.v.toFixed(2))} 
      onValueChange={value => onColorChange({...color, v : parseFloat(value.toFixed(2))})}
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
