import React, { useState, memo } from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { fromHsv, toHsv } from 'react-native-color-picker';

import { palette } from '../assets/palette';

const ChatBubble = ({ text, textStyle, timestamp, messageFrom, customStyle, activeOpacity,
                      onLongPress, onPress, disableTouch = false, highlighted }) => {

  const boxStyle = {
    ...styles.message,
    ...(messageFrom ? {...styles.messageFromYou} : {...styles.messageFromOther}),
    backgroundColor : messageFrom ? customStyle.sentBoxColor : customStyle.receivedBoxColor,
    ...(highlighted && {...styles.highlighted})
  }

  const getTextStyle = textType => {
    return ({
      ...(textType === "messageText" && {...styles.messageText}),
      ...(textType === "timestamp" && {...styles.timestamp}),
      color : messageFrom ? customStyle.sentTextColor : customStyle.receivedTextColor,
      fontSize : customStyle.messageFontSize
    })
  }

  return (
    <TouchableOpacity
    disabled={disableTouch}
    activeOpacity={activeOpacity}
    onLongPress={onLongPress}
    onPress={onPress}
    style={boxStyle}>
      <Text
      style={{...getTextStyle("messageText"),...textStyle}}>
        {text}
      </Text>
      <Text
      style={getTextStyle("timestamp")}>
        {timestamp}
      </Text>
    </TouchableOpacity>
  )
}

const styles = {
  messageFromOther : {
    backgroundColor : palette.primary,
    maxWidth: "90%",
    alignSelf : "flex-start",
    marginLeft : 5,
  },
  messageFromYou : {
    backgroundColor : palette.mediumgrey,
    alignSelf : "flex-end",
    maxWidth : "90%",
    marginRight : 5
  },
  message : {
    padding : 20,
    marginVertical : 3,
    borderRadius : 10,
    borderWidth : 2,
    borderColor : "transparent"
  },
  messageText : {
    color : palette.offwhite
  },
  timestamp : {
    fontWeight : "bold",
    alignSelf : "flex-end",
  },
  highlighted : {
    borderWidth : 2,
    borderColor : palette.black,
    borderStyle : "dotted"
  }
}

export default memo(ChatBubble)
