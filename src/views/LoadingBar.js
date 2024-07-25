import React, { useState, useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';

import { palette } from '../assets/palette';

const LoadingBar = ({containerStyle, loadingBarStyle, numBars = 1,
                     barColor = palette.grey, sliderColor = palette.black,
                     animationDuration = 500, paused = false}) => {
  const loadingViewPosition = useRef(new Animated.Value(0)).current;
  const [outerWidth , setOuterWidth] = useState(0);
  const [innerWidth, setInnerWidth] = useState(0);

  let animationLoop;
  const moveToEnd = Animated.timing(loadingViewPosition, {
    toValue: outerWidth - innerWidth,
    duration: animationDuration,
    useNativeDriver : true,
    isInteraction : false //https://github.com/facebook/react-native/issues/8624
  })

  const moveToBeginning = Animated.timing(loadingViewPosition, {
    toValue: 0,
    duration: animationDuration,
    useNativeDriver : true,
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
    }
  },[paused])

  useEffect(() => {
    if(outerWidth > 0 && innerWidth > 0 && !paused) {
      animationLoop = Animated.loop(
        Animated.sequence([
          moveToEnd,
          moveToBeginning
        ])
      ).start();
    }
  },[outerWidth, innerWidth, paused])

  return (
    [...Array(numBars).keys()].map(num => {
    return (
      <View key={num} style={{
        ...styles.loadingContainerView,
        ...containerStyle,
        backgroundColor : barColor,
        marginTop : (numBars > 1 && num > 0) ? 10: 0
      }}
      onLayout={e => setOuterWidth(e.nativeEvent.layout.width)}>
        <Animated.View
        onLayout={e => setInnerWidth(e.nativeEvent.layout.width)}
        style={{
          ...styles.loadingView,
          ...loadingBarStyle,
          transform : [{translateX : loadingViewPosition}],
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
