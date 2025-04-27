import React, { useEffect, useRef } from 'react';
import { Text } from 'react-native';

import { clamp } from '../helper';

import Slider from './Slider'

const ValueSlider = ({title, titleStyle, value, useValue, ...props}) => {
  const valueRef = useRef(value)
  const { min, max, step } = props;
 
  useEffect(() => {
    if(useValue) {
      valueRef.current = clamp(value,min,max);
    }
  },[value, useValue, min, max])

  return (
    <>
      {title?.length > 0 &&
      <Text style={{
        ...styles.title,
        ...titleStyle
      }}>
        {title}
      </Text>}
      <Slider
      value={(() => {
        if(useValue) {
          if(value == min) {
            return value + step;
          }
          else {
            return clamp(value,min,max);
          }
        }
        else {
          return valueRef.current;
        }
      })()}
      {...props} 
      />
    </>
  )
}

const styles = {
  title : {
    alignSelf : "center",
    fontWeight : "bold",
  }
}

export default ValueSlider;
