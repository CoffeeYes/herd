import React, { useState } from 'react';
import { View } from 'react-native';
import { Svg, Defs, Stop, LinearGradient, Line } from 'react-native-svg';

const GradientLine = ({ gradientPoints = [], lineWidth = 10, style }) => {
  const [containerWidth, setContainerWidth] = useState(1);
  return (
    <View style={style} onLayout={e => setContainerWidth(e.nativeEvent.layout.width)}>
      <Svg viewBox={`0 0 ${containerWidth} ${lineWidth}`}>
        <Defs>  
          <LinearGradient id="gradient" x1="0%" x2="100%" y1="0" y2="0">
            {gradientPoints.length > 1 && gradientPoints.map((point,index) => {
              return (
                <Stop offset={`${(index / (gradientPoints.length -1)) * 100}%`} stopColor={point.color} stopOpacity={point.opacity} key={`${point.color}-${index}`}/>
              )
            })}
          </LinearGradient>
        </Defs>
        <Line stroke="url(#gradient)" x1="0%" x2="100%" y1="0" y2="0" strokeWidth={lineWidth.toString()}/>
      </Svg>
    </View>
  )
}

export default GradientLine;
