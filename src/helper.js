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

const getSizeFromOrientation = (
  portraitMultiplier,
  landscapeMultiplier,
  multiplyBy,
  portraitOversizeCorrectionFactor = 1,
  landscapeOversizeCorrectionFactor = 1,
  portraitOversizeCorrectionThreshold,
  landscapeOversizeCorrectionThreshold,
) => {
  const windowDimensions = Dimensions.get("window");
  const { width, height } = windowDimensions;

  const multiplicationBase = windowDimensions[multiplyBy];

  if(height > width) {
    if(height > portraitOversizeCorrectionThreshold) {
      return multiplicationBase * portraitMultiplier * portraitOversizeCorrectionFactor;
    }
    else {
      return multiplicationBase * portraitMultiplier;
    }
  }
  else {
    if(width > landscapeOversizeCorrectionThreshold) {
      return multiplicationBase * landscapeMultiplier * landscapeOversizeCorrectionFactor;
    }
    else {
      return multiplicationBase * landscapeMultiplier;
    }
  }
}

const useScreenAdjustedSize = (
  portraitMultiplier = 0.5,
  landscapeMultiplier = 0.5,
  multiplyBy = "width",
  portraitOversizeCorrectionFactor = 1,
  landscapeOversizeCorrectionFactor = 1,
  portraitOversizeCorrectionThreshold,
  landscapeOversizeCorrectionThreshold,
) => {
  if(!["width","height"].includes(multiplyBy.toLowerCase())) {
    throw new Error("argument 'multiplyBy' passed to useScreenAdjustedSize is not 'width' or 'height'");
  }

  const [size, setSize] = useState(
    getSizeFromOrientation(
      portraitMultiplier,
      landscapeMultiplier,
      multiplyBy,
      portraitOversizeCorrectionFactor,
      landscapeOversizeCorrectionFactor,
      portraitOversizeCorrectionThreshold,
      landscapeOversizeCorrectionThreshold,
    )
  );

  useEffect(() => {
    //adjust iconSize whenever orientation is changed
    const orientationListener = Dimensions.addEventListener("change",() => {
      setSize(getSizeFromOrientation(
        portraitMultiplier,
        landscapeMultiplier,
        multiplyBy,
        portraitOversizeCorrectionFactor,
        landscapeOversizeCorrectionFactor,
        portraitOversizeCorrectionThreshold,
        landscapeOversizeCorrectionThreshold,
      ));
    })

    return () => {orientationListener.remove()}
  },[])

  return size;
}

export {
  timestampToText,
  useScreenAdjustedSize
}
