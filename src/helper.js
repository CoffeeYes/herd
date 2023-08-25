import moment from 'moment';
import React, { useState, useEffect, Dimensions } from 'react';

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

const getIconSizeFromOrientation = (dimensions, portraitMultiplier, landscapeMultiplier, multiplyBy) => {
  const windowDimensions = dimensions.get("window");
  const { width, height } = windowDimensions;
  const multiplicationBase = windowDimensions[multiplyBy];
  if(height > width) {
    return multiplicationBase * portraitMultiplier;
  }
  else {
    return multiplicationBase * landscapeMultiplier;
  }
}

const useScreenAdjustedIconSize = (dimensions, portraitMultiplier = 0.5, landscapeMultiplier = 0.5, multiplyBy = "width") => {
  if(!["width","height"].includes(multiplyBy.toLowerCase())) {
    throw new Error("argument 'multiplyBy' passed to useScreenAdjustedIconSize is not 'width' or 'height'");
  }

  const [size, setSize] = useState(1);

  useEffect(() => {
    //set initial iconSize based on orientation
    setSize(getIconSizeFromOrientation(dimensions,portraitMultiplier,landscapeMultiplier,multiplyBy));

    //adjust iconSize whenever orientation is changed
    const orientationListener = dimensions.addEventListener("change",() => {
      setSize(getIconSizeFromOrientation(dimensions,portraitMultiplier,landscapeMultiplier,multiplyBy));
    })

    return () => {orientationListener.remove()}
  },[])

  return size;
}

export {
  timestampToText,
  useScreenAdjustedIconSize
}
