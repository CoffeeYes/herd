import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';

import { palette } from '../assets/palette';

import Crypto from '../nativeWrapper/Crypto';

const FoldableMessage = ({open, to = "N/A", from = "N/A", timestamp, text, style, onPress, loading}) => {

  return (
    <TouchableOpacity style={{...styles.container, paddingBottom : open ? 0 : 20}} onPress={onPress}>
      <View style={{width : "100%"}}>
        {loading ?
        <ActivityIndicator size="large" color={palette.primary}/>
        :
        <>
          <View style={styles.messageHeader}>
            <Text>From : {from}</Text>
            <Text>To: {to}</Text>
            <Text>{timestamp}</Text>
          </View>
          {open &&
          <View style={styles.messageText}>
            <Text>{text}</Text>
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
}

export default FoldableMessage;
