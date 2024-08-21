import React from 'react';
import { View } from 'react-native';
import { Svg, Defs, Stop, LinearGradient, Line } from 'react-native-svg';

const GradientLine = ({ gradientStart, gradientEnd, lineWidth = 10}) => {

  return (
    <View>
      <Svg width="100%" height="10">
        <Defs>  
          <LinearGradient id="gradient" x1="0" x2="1" y1="0" y2="0">
            <Stop offset="0" stopColor={gradientStart} stopOpacity="1" />
            <Stop offset="1" stopColor={gradientEnd} stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Line stroke="url(#gradient)" x1="0%" x2="100%" y1="0" y2="0" strokeWidth={lineWidth.toString()}/>
      </Svg>
    </View>
  )
}

export default GradientLine;
