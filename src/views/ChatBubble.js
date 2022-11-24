import React, { useState } from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { fromHsv, toHsv } from 'react-native-color-picker';

const ChatBubble = ({ text, timestamp, messageFrom, customStyle,
                      onLongPress, onPress, notTouchable, highlighted }) => {
  return (
    <TouchableOpacity
    disabled={notTouchable}
    onLongPress={onLongPress}
    onPress={onPress}
    style={messageFrom ?
      {...styles.message,
       ...styles.messageFromYou,
       backgroundColor : customStyle.sentBoxColor,
       ...(highlighted && {...styles.highlighted})}
      :
      {...styles.message,
       ...styles.messageFromOther,
       backgroundColor : customStyle.receivedBoxColor,
       ...(highlighted && {...styles.highlighted})}}>
      <Text
      style={{
        ...styles.messageText,
        color : messageFrom ? customStyle.sentTextColor : customStyle.receivedTextColor,
        fontSize : customStyle.fontSize
      }}>
        {text}
      </Text>
      <Text
      style={{
      ...styles.timestamp,
      color : messageFrom ? customStyle.sentTextColor : customStyle.receivedTextColor,
      fontSize : customStyle.fontSize
      }}>
        {timestamp}
      </Text>
    </TouchableOpacity>
  )
}

const styles = {
  messageFromOther : {
    backgroundColor : "#E86252",
    maxWidth: "90%",
    alignSelf : "flex-start",
    marginLeft : 5,
  },
  messageFromYou : {
    backgroundColor : "#c6c6c6",
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
    color : "#f5f5f5"
  },
  timestamp : {
    fontWeight : "bold",
    alignSelf : "flex-end"
  },
  highlighted : {
    borderWidth : 2,
    borderColor : "black",
    borderStyle : "dotted"
  }
}

export default ChatBubble
