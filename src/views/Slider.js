import React from 'react';
import { View, Text } from 'react-native';
import Slider from '@react-native-community/slider';

import { palette } from '../assets/palette';
import GradientLine from './GradientLine';

const CustomSlider = ({
                        rightTitle, rightText, containerStyle, sliderStyle,
                        rightTextContainerStyle, rightTextStyle, rightTitleStyle,
                        min, max,
                        showColorPreview, previewGradientPoints,
                        ...props}) => {
  return (
    <View style={{...styles.container,...containerStyle}}>
      <View style={styles.sliderContainer}>
      {showColorPreview &&
      <GradientLine
      style={styles.gradientLine}
      gradientPoints={previewGradientPoints}/>}
      <Slider
      minimumValue={min}
      maximumValue={max}
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

CustomSlider.defaultProps = {
  minimumTrackTintColor : palette.secondary,
  maximumTrackTintColor : palette.primary,
  thumbTintColor : palette.primary
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
  gradientLine : {
    paddingHorizontal : 15,
    flex : 1
  }
}

export default CustomSlider;
