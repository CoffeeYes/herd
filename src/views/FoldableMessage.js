import React, { useState, useEffect, memo } from 'react';
import { useSelector } from 'react-redux';
import { View, Text, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';

import { palette } from '../assets/palette';

import Crypto from '../nativeWrapper/Crypto';

import LoadingBar from './LoadingBar';

const componentShouldUpdate = (props, nextProps) => {
  for(const key of Object.keys(props)) {
    if(typeof props[key] !== "function" && props[key] !== nextProps[key]) {
      return false;
    }
  }
  return true;
}

const FoldableMessage = ({open, to = "N/A", from = "N/A", closedTimestamp, text, textFontSize, onPress, loading,
                          openTimestamp, containerStyle, headerTitleStyle, headerTextStyle, headerNumberOfLines = 1,
                          openTimestampStyle}) => {
  return (
    <TouchableOpacity style={{...styles.container, paddingBottom : open ? 0 : 20, ...containerStyle}} onPress={onPress}>
      <View style={{width : "100%"}}>
        {loading ?
        <LoadingBar barColor="rgba(0,0,0,0.1)" sliderColor="rgba(0,0,0,0.1)"/>
        :
        <>
          <View style={styles.messageHeader}>
            <View style={styles.headerTextContainer}>
              <Text numberOfLines={headerNumberOfLines} style={{fontWeight : "bold", ...headerTitleStyle}}>From:</Text>
              <Text numberOfLines={headerNumberOfLines} style={headerTextStyle}>{from}</Text>
            </View>
            <View style={styles.headerTextContainer}>
              <Text numberOfLines={headerNumberOfLines} style={{fontWeight : "bold", ...headerTitleStyle}}>To:</Text>
              <Text numberOfLines={headerNumberOfLines} style={headerTextStyle}>{to}</Text>
            </View>
            <View style={{...styles.headerTextContainer, alignSelf : "center", maxWidth : "40%"}}>
              <Text numberOfLines={headerNumberOfLines} style={headerTextStyle}>{closedTimestamp}</Text>
            </View>
          </View>
          {open &&
          <View style={styles.messageText}>
            <Text style={{fontSize : textFontSize}}>{text}</Text>
            <Text style={{
              alignSelf : "flex-end",
              fontSize : textFontSize,
              ...openTimestampStyle
            }}>
              {openTimestamp}
            </Text>
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
    paddingHorizontal : 20,
    overflow : "hidden"
  },
  headerTextContainer : {
    maxWidth : "30%",
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

export default memo(FoldableMessage,componentShouldUpdate);
