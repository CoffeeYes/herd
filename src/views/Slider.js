import React from 'react';
import { View, Text } from 'react-native';
import Slider from '@react-native-community/slider';

import { palette } from '../assets/palette';

const CustomSlider = ({
                        rightTitle, rightText, containerStyle, sliderStyle,
                        rightTextContainerStyle, rightTextStyle, rightTitleStyle,
                        min, max,...props}) => {
  return (
    <View style={{...styles.container,...containerStyle}}>
      <Slider
      minimumValue={min}
      maximumValue={max}
      minimumTrackTintColor={palette.secondary}
      maximumTrackTintColor={palette.primary}
      thumbTintColor={palette.primary}
      style={{...styles.slider, ...sliderStyle}}
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

const styles = {
  container : {
    alignItems : "center",
    alignSelf : "center",
    flexDirection : "row",
    margin : 10,
    backgroundColor : palette.white
  },
  slider : {
    flex : 1
  }
}

export default CustomSlider;
