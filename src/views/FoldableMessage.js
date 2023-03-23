import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { View, Text, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';

import { palette } from '../assets/palette';

import Crypto from '../nativeWrapper/Crypto';

import LoadingBar from './LoadingBar';

const FoldableMessage = ({open, to = "N/A", from = "N/A", closedTimestamp, text, style, onPress, loading,
                          openTimestamp}) => {
  const customStyle = useSelector(state => state.chatReducer.styles);

  return (
    <TouchableOpacity style={{...styles.container, paddingBottom : open ? 0 : 20}} onPress={onPress}>
      <View style={{width : "100%"}}>
        {loading ?
        <LoadingBar barColor="rgba(0,0,0,0.1)" sliderColor="rgba(0,0,0,0.1)"/>
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
