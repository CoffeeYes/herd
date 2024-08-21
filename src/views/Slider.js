import React from 'react';
import { View, Text } from 'react-native';
import Slider from '@react-native-community/slider';

import { palette } from '../assets/palette';
import GradientLine from './GradientLine';

const CustomSlider = ({
                        rightTitle, rightText, containerStyle, sliderStyle,
                        rightTextContainerStyle, rightTextStyle, rightTitleStyle,
                        min, max, thumbTintColor,
                        showColorPreview, previewGradientStart, previewGradientEnd,
                        minimumTrackTintColor, maximumTrackTintColor, ...props}) => {
  return (
    <View style={{...styles.container,...containerStyle}}>
      <View style={styles.sliderContainer}>
      {showColorPreview &&
      <GradientLine
      gradientStart={previewGradientStart}
      gradientEnd={previewGradientEnd}/>}
      <Slider
      minimumValue={min}
      maximumValue={max}
      minimumTrackTintColor={minimumTrackTintColor || palette.secondary}
      maximumTrackTintColor={maximumTrackTintColor || palette.primary}
      thumbTintColor={thumbTintColor || palette.primary}
      style={{...styles.slider, ...sliderStyle}}
      {...props}/>
      </View>
      <View style={rightTextContainerStyle}>
        {rightTitle?.toString().length > 0 &&
        <Text style={rightTitleStyle}>{rightTitle.toString()}</Text>}
        {rightText?.toString()?.length > 0 &&
        <Text style={rightTextStyle}>{rightText.toString()}</Text>}
      </View>
    </View>
  )
}

const styles = {
  container : {
    alignItems : "center",
    alignSelf : "center",
    flexDirection : "row",
    margin : 10,
    backgroundColor : palette.white,
  },
  sliderContainer : {
    flex : 1,
  },
}

export default CustomSlider;
