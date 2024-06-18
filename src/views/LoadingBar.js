import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';

import { palette } from '../assets/palette';

const LoadingBar = ({containerStyle, loadingBarStyle, numBars = 1,
                     barColor = palette.grey, sliderColor = palette.black,
                     animationDuration = 500, paused = false}) => {
  const loadingViewPosition = useRef(new Animated.Value(0)).current;

  let animationLoop;
  const moveToEnd = Animated.timing(loadingViewPosition, {
    toValue: 100,
    duration: animationDuration,
    useNativeDriver : false,
    isInteraction : false //https://github.com/facebook/react-native/issues/8624
  })

  const moveToBeginning = Animated.timing(loadingViewPosition, {
    toValue: 0,
    duration: animationDuration,
    useNativeDriver : false,
    isInteraction : false
  })

  useEffect(() => {
    if(paused) {
      if(animationLoop) {
        animationLoop.stop();
      }
    }
    else {
      //restart existing animation, otherwise create animation if it's the first time
      if(animationLoop) {
        animationLoop.start();
      }
      else {
        animationLoop = Animated.loop(
          Animated.sequence([
            moveToEnd,
            moveToBeginning
          ])
        ).start();
      }
    }
  },[paused])

  return (
    [...Array(numBars).keys()].map(num => {
    return (
      <View key={num} style={{
        ...styles.loadingContainerView,
        ...containerStyle,
        backgroundColor : barColor,
        marginTop : (numBars > 1 && num > 0) ? 10: 0
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
    })
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
