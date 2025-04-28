import React, { useEffect, useRef } from 'react';
import { Text } from 'react-native';

import { clamp } from '../helper';

import Slider from './Slider'

const ValueSlider = ({title, titleStyle, value, useValue, ...props}) => {
  const valueRef = useRef(value)
  const { minimumValue, maximumValue, step } = props;
 
  useEffect(() => {
    if(useValue) {
      valueRef.current = clamp(value,minimumValue,maximumValue);
    }
  },[value, useValue, minimumValue, maximumValue])

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
          if(value == minimumValue) {
            return value + step;
          }
          else {
            return clamp(value,minimumValue,maximumValue);
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
