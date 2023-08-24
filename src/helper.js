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

const getIconSizeFromOrientation = (windowDimensions, portraitMultiplier, landscapeMultiplier) => {
  const { width, height } = windowDimensions.get("window");

  if(height > width) {
    return width * portraitMultiplier;
  }
  else {
    return width * landscapeMultiplier;
  }
}

const useScreenAdjustedIconSize = (windowDimensions, portraitMultiplier = 0.5, landscapeMultiplier = 0.5) => {
  const [size, setSize] = useState(1);

  useEffect(() => {
    //set initial iconSize based on orientation
    setSize(getIconSizeFromOrientation(windowDimensions,portraitMultiplier,landscapeMultiplier));

    //adjust iconSize whenever orientation is changed
    const orientationListener = windowDimensions.addEventListener("change",() => {
      setSize(getIconSizeFromOrientation(windowDimensions,portraitMultiplier,landscapeMultiplier));
    })

    return () => {orientationListener.remove()}
  },[])

  return size;
}

export {
  timestampToText,
  useScreenAdjustedIconSize
}
