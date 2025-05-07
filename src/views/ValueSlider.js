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
          //need to clamp to min + step due to bug
          //but can be recreated by going sent text, setting values to anything above min
          //and switching back to sent box with 0 values, where the value will be correct
          //but slider position wont, until you swap back and forth again.
          return clamp(value,minimumValue + step,maximumValue);
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
