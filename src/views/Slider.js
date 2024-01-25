import React from 'react';
import { View, Text } from 'react-native';
import Slider from '@react-native-community/slider';

const CustomSlider = ({
                        rightTitle, rightText, containerStyle, sliderStyle,
                        rightTextContainerStyle, rightTextStyle, rightTitleStyle,
                        min, max,...props}) => {
  return (
    <View style={containerStyle}>
      <Slider
      minimumValue={min}
      maximumValue={max}
      style={sliderStyle}
      {...props}/>
      <View style={rightTextContainerStyle}>
        {rightTitle?.toString().length > 0 &&
        <Text style={rightTitleStyle}>{rightTitle.toString()}</Text>}
        {rightText?.toString()?.length > 0 &&
        <Text style={rightTextStyle}>{rightText.toString()}</Text>}
      </View>
    </View>
  )
}

export default CustomSlider;
