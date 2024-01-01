import React, { useState, useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';

import { palette } from '../assets/palette';

const LoadingBar = ({containerStyle, loadingBarStyle,
                     barColor = palette.grey, sliderColor = palette.black,
                     animationDuration = 500}) => {
  const loadingViewPosition = useRef(new Animated.Value(0)).current;

  const moveToEnd = () => {
    return Animated.timing(loadingViewPosition, {
      toValue: 100,
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
    moveToEnd();
  },[])

  return (
    <View style={{
      ...styles.loadingContainerView,
      ...containerStyle,
      backgroundColor : barColor
    }}>
      <Animated.View
      style={{
        ...styles.loadingView,
        ...loadingBarStyle,
        marginLeft : loadingViewPosition.interpolate({
          inputRange : [0,100],
          outputRange : ["0%","80%"]
        }),
        backgroundColor : sliderColor
      }}/>
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
    overflow : "hidden"
  },
  loadingView : {
    width : "20%",
    height : "100%",
    borderRadius : 5
  }
}
