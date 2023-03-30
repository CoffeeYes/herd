import React, { useState, useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';

import { palette } from '../assets/palette';

const LoadingBar = ({containerStyle, loadingBarStyle, barColor, sliderColor, animationDuration = 500}) => {
  const loadingViewPosition = useRef(new Animated.Value(0)).current;
  const [containerWidth, setContainerWidth] = useState(0);
  const [barWidth, setBarWidth] = useState(0);
  const [animationStarted, setAnimationStarted] = useState(false);

  const moveToEnd = () => {
    return Animated.timing(loadingViewPosition, {
      toValue: containerWidth - barWidth,
      duration: animationDuration,
      useNativeDriver : false
    }).start(moveToBeginning)
  }

  const moveToBeginning = () => {
    Animated.timing(loadingViewPosition, {
      toValue: 0,
      duration: animationDuration,
      useNativeDriver : false
    }).start(moveToEnd)
  }

  useEffect(() => {
    if (containerWidth > 0 && barWidth > 0 && !animationStarted && loadingViewPosition) {
      setAnimationStarted(true);
      moveToEnd();
    }
  },[containerWidth,barWidth,loadingViewPosition])

  return (
    <View style={{
      ...styles.loadingContainerView,
      ...containerStyle,
      ...(barColor && {backgroundColor : barColor})
    }}
    onLayout={e => setContainerWidth(e.nativeEvent.layout.width)}>
      <Animated.View
      style={{
        ...styles.loadingView,
        ...loadingBarStyle,
        marginLeft : loadingViewPosition,
        ...(sliderColor && {backgroundColor : sliderColor})
      }}
      onLayout={e => setBarWidth(e.nativeEvent.layout.width)}/>
    </View>
  )
}

export default LoadingBar

const styles = {
  loadingContainerView : {
    flex : 1,
    width : "90%",
    alignSelf : "center",
    height : 10,
    borderRadius : 5,
    backgroundColor : palette.grey,
    overflow : "hidden"
  },
  loadingView : {
    width : "20%",
    height : "100%",
    backgroundColor : palette.black,
    borderRadius : 5
  }
}
