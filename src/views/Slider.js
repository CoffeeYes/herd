import React from 'react';
import { View, Text } from 'react-native';
import Slider from '@react-native-community/slider';

const CustomSlider = ({ value, onValueChange, onSlidingComplete, min, max,
                        rightTitle, rightText, containerStyle, sliderStyle,
                        rightTextContainerStyle, rightTextStyle, rightTitleStyle,
                        tapToSeek, minimumTrackTintColor, maximumTrackTintColor,
                        thumbTintColor }) => {
  return (
    <View style={containerStyle}>
      <Slider
      minimumTrackTintColor={minimumTrackTintColor}
      maximumTrackTintColor={maximumTrackTintColor}
      thumbTintColor={thumbTintColor}
      style={sliderStyle}
      tapToSeek={tapToSeek}
      onSlidingComplete={onSlidingComplete}
      onValueChange={onValueChange}
      value={value}
      minimumValue={min}
      maximumValue={max}/>
      <View style={rightTextContainerStyle}>
        {rightTitle?.length > 0 &&
        <Text style={rightTitleStyle}>{rightTitle}</Text>}
        {rightText?.length > 0 &&
        <Text style={rightTextStyle}>{rightText}</Text>}
      </View>
    </View>
  )
}

export default CustomSlider;
