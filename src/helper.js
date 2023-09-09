import moment from 'moment';
import React, { useState, useEffect } from 'react';
import { Dimensions } from 'react-native';

const timestampToText = (timestamp,format) => {
  const today = moment();
  const yesterday = moment().subtract(1,"days");
  const dateToParse = moment(timestamp);

  if(today.format("DD/MM/YYYY") == dateToParse.format("DD/MM/YYYY")) {
    return "Today";
  }
  else if (yesterday.format("DD/MM/YYYY") == dateToParse.format("DD/MM/YYYY")) {
    return "Yesterday"
  }
  else {
    return dateToParse.format(format);
  }
}

const getIconSizeFromOrientation = (portraitMultiplier, landscapeMultiplier, multiplyBy) => {
  const windowDimensions = Dimensions.get("window");
  const { width, height } = windowDimensions;

  const multiplicationBase = windowDimensions[multiplyBy];
  let oversizeReductionFactor = 1;
  
  if(height > width) {
    return multiplicationBase * portraitMultiplier;
  }
  else {
    if(width > 1000) {
      oversizeReductionFactor = 0.7;
    }
    return multiplicationBase * landscapeMultiplier * oversizeReductionFactor;
  }
}

const useScreenAdjustedSize = (portraitMultiplier = 0.5, landscapeMultiplier = 0.5, multiplyBy = "width") => {
  if(!["width","height"].includes(multiplyBy.toLowerCase())) {
    throw new Error("argument 'multiplyBy' passed to useScreenAdjustedSize is not 'width' or 'height'");
  }

  const [size, setSize] = useState(getIconSizeFromOrientation(portraitMultiplier,landscapeMultiplier,multiplyBy));

  useEffect(() => {
    //adjust iconSize whenever orientation is changed
    const orientationListener = Dimensions.addEventListener("change",() => {
      setSize(getIconSizeFromOrientation(portraitMultiplier,landscapeMultiplier,multiplyBy));
    })

    return () => {orientationListener.remove()}
  },[])

  return size;
}

export {
  timestampToText,
  useScreenAdjustedSize
}
