import React from 'react';
import { ActivityIndicator } from 'react-native';
import { palette } from '../assets/palette';

const LoadingIndicator = ({size, color, style, animating = true}) => {
  return (
    <ActivityIndicator 
    size={size || "large"}
    color={color || palette.primary}
    animating={animating}
    style={style}
    />
  )
}

export default LoadingIndicator;
