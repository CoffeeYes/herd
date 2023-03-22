import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { View, Text, TouchableOpacity, Dimensions, ActivityIndicator, Animated } from 'react-native';

import { palette } from '../assets/palette';

import Crypto from '../nativeWrapper/Crypto';

import LoadingBar from './LoadingBar';

const FoldableMessage = ({open, to = "N/A", from = "N/A", closedTimestamp, text, style, onPress, loading,
                          openTimestamp}) => {
  const customStyle = useSelector(state => state.chatReducer.styles);
  const loadingViewPosition = useRef(new Animated.Value(0)).current;

  const moveToEnd = () => {
    return Animated.timing(loadingViewPosition, {
      toValue: 300,
      duration: 1000,
      useNativeDriver : false
    }).start(moveToBeginning)
  }

  const moveToBeginning = () => {
    Animated.timing(loadingViewPosition, {
      toValue: 0,
      duration: 1000,
      useNativeDriver : false
    }).start(moveToEnd)
  }
  useEffect(() => {
    Animated.loop(
      moveToEnd()
      // Animated.timing(loadingViewPosition, {
      //   toValue: 300,
      //   duration: 1000,
      //   useNativeDriver : false
      // }).start(() => {
      //   Animated.timing(loadingViewPosition, {
      //     toValue: 0,
      //     duration: 1000,
      //     useNativeDriver : false
      //   }).start();
      // })
    );
  },[loadingViewPosition])
  return (
    <TouchableOpacity style={{...styles.container, paddingBottom : open ? 0 : 20}} onPress={onPress}>
      <View style={{width : "100%"}}>
        {loading ?
        <LoadingBar/>
        :
        <>
          <View style={styles.messageHeader}>
            <Text>From : {from}</Text>
            <Text>To: {to}</Text>
            <Text>{closedTimestamp}</Text>
          </View>
          {open &&
          <View style={styles.messageText}>
            <Text style={{fontSize : customStyle.uiFontSize}}>{text}</Text>
            <Text style={{alignSelf : "flex-end"}}>{openTimestamp}</Text>
          </View>}
        </>}
      </View>
    </TouchableOpacity>
  )
}

const styles = {
  messageHeader : {
    flexDirection : "row",
    justifyContent : "space-between",
    width : "100%",
    paddingHorizontal : 20
  },
  messageText : {
    marginTop : 10,
    width : "100%",
    backgroundColor : palette.offgrey,
    padding : 20,
  },
  container : {
    flexDirection : "row",
    backgroundColor : palette.white,
    paddingVertical : 20,
    backgroundColor : palette.white,
    width : Dimensions.get('window').width * 0.8,
    marginVertical : 5,
    borderRadius : 10,
    elevation : 2
  },
  loadingContainerView : {
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

export default FoldableMessage;
