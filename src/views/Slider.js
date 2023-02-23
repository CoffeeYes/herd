import React from 'react';
import { View, Text } from 'react-native';
import Slider from '@react-native-community/slider';

const CustomSlider = ({ value, onValueChange, onSlidingComplete, min, max,
                        rightTitle, rightText, containerStyle, sliderStyle,
                        rightTextContainerStyle, rightTextStyle, rightTitleStyle,
                        tapToSeek }) => {
  return (
    <View style={containerStyle}>
      <Slider
      style={sliderStyle}
      tapToSeek={tapToSeek}
      onSlidingComplete={onSlidingComplete}
      onValueChange={onValueChange}
      value={value}
      minimumValue={min}
      maximumValue={max}/>
      <View style={rightTextContainerStyle}>
        <Text style={rightTitleStyle}>{rightTitle}</Text>
        <Text style={rightTextStyle}>{rightText}</Text>
      </View>
    </View>
  )
}

export default CustomSlider;
