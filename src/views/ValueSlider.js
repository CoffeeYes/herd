import React, { useEffect, useRef } from 'react';
import { Text } from 'react-native';

import Slider from './Slider'

const ValueSlider = ({title, titleStyle, value, useValue, ...props}) => {
  const valueRef = useRef(value)
 
  useEffect(() => {
    if(useValue) {
      valueRef.current = value;
    }
  },[value, useValue])

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
          if(value == props.min) {
            return value + props.step;
          }
          else {
            return value;
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
