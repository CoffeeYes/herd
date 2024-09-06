import moment from 'moment';
import { useState, useEffect, useRef } from 'react';
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

const useOrientationBasedStyle = (portraitStyle, landscapeStyle) => {
  const [style, setStyle] = useState(portraitStyle);

  useEffect(() => {
    //adjust iconSize whenever orientation is changed
    const orientationListener = Dimensions.addEventListener("change", dimensions => {
      const { height, width } = dimensions.window;

      if(height > width) {
        setStyle(portraitStyle);
      }
      else {
        setStyle(landscapeStyle)
      }
    })

    return () => {orientationListener.remove()}
  },[])

  return style;
}

const useStateAndRef = (initialValue) => {
  const [state, setState] = useState(initialValue);
  const ref = useRef(initialValue);

  const update = data => {
    setState(data);
    ref.current = data;
  }

  return [state,update,ref];
}

const clamp = (val, min, max) => {
  let clamped = val;
  if(clamped < min) {
    clamped = min;
  }
  else if (clamped > max) {
    clamped = max;
  }
  return clamped;
}

const hexToInt = hex => {
  return Number(`0x${hex}`)
}

//https://math.stackexchange.com/questions/556341/rgb-to-hsv-color-conversion-algorithm/
const toHsv = rgb => {
  if(rgb?.h && rgb?.s && rgb?.v) {
    return {h : rgb.h, s : rgb.s, v : rgb.v}
  }
  //get hex letters from rgb color code
  let r = rgb.slice(1,3);
  let g = rgb.slice(3,5);
  let b = rgb.slice(5,7);

  //convert hex to integer
  r = hexToInt(r);
  g = hexToInt(g);
  b = hexToInt(b);

  //determine formula for hue based on integer maximum to avoid floating point comparison
  const integerMax = Math.max(r,g,b);
  let hueTarget = "r";
  if(integerMax == g) {
    hueTarget = "g";
  }
  else if(integerMax == b) {
    hueTarget = "b";
  }

  //normalize
  r = r / 255;
  g = g / 255;
  b = b / 255;

  const max = Math.max(r,g,b);
  const min = Math.min(r,g,b);
  const delta = max - min;
  if(delta == 0) {
    return ({h : 0, s : 0.0, v : max})
  }

  let h;
  
  if(hueTarget == "r") {
    h = ((g - b)/delta) % 6;
  }
  else if (hueTarget == "g") {
    h = ((b - r)/delta) + 2;
  }
  else {
    h = ((r - g)/delta) + 4;
  }
  h = 60 * h;
  if (h < 0) {
    h = 360 + h;
  }

  let s = 0;
  if(max > 0) {
    s = delta / max;
  }

  const v = max;

  return ({h,s,v})
}

const colorToHex = (number, multiplier = 1) => {
  let hex = Math.round(number * multiplier).toString(16);
  if (hex.length == 1) {
    hex = "0" + hex;
  }
  return hex;
}

//https://cs.stackexchange.com/questions/64549/convert-hsv-to-rgb-colors
const fromHsv = hsv => {
  if(typeof hsv == "string") {
    return hsv;
  }
  const {h,s,v} = hsv;
  const max = v;
  const chroma = s * v;
  const min = max - chroma;

  let hNorm = h;
  if(h > 300) {
    hNorm = (h - 360)/60;
  }
  else {
    hNorm = (h/60);
  }
  let r,g,b;
  if(hNorm >= -1 && hNorm < 1) {
    if(hNorm < 0) {
      r = max;
      g = min;
      b = (min - hNorm * chroma);
    }
    else {
      r = max;
      g = (min + hNorm * chroma);
      b = min;
    }
  }
  else if (hNorm >= 1 && hNorm < 3) {
    if(hNorm - 2 < 0) {
      r = min - (hNorm - 2) * chroma
      g = max;
      b = min;
    }
    else {
      r = min;
      g = max;
      b = min + (hNorm - 2) * chroma;
    }
  }
  else {
    if(hNorm - 4 < 0) {
      r = min;
      g = min - (hNorm - 4) * chroma;
      b = max;
    }
    else {
      r = min + (hNorm - 4) * chroma;
      g = min;
      b = max;
    } 
  }

  r = colorToHex(r,255);
  g = colorToHex(g,255);
  b = colorToHex(b,255);

  return `#${r}${g}${b}`
}

export {
  timestampToText,
  useScreenAdjustedSize,
  useOrientationBasedStyle,
  useStateAndRef,
  clamp,
  fromHsv,
  toHsv 
}
