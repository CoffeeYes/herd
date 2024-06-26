import React, { useState, memo } from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Clipboard from '@react-native-clipboard/clipboard';

import { palette } from '../assets/palette';

const ChatBubble = ({ text, textFontSize, timestamp, messageFrom, customStyle, activeOpacity,
                      onLongPress, onPress, disableTouch = false, highlighted, onLayout, showCopyButton }) => {

  const [showCopyConfirmation, setShowCopyConfirmation] = useState(false);

  const boxStyle = {
    ...styles.message,
    backgroundColor : messageFrom ? customStyle.sentBoxColor : customStyle.receivedBoxColor,
    ...(messageFrom ? {...styles.messageFromYou} : {...styles.messageFromOther}),
    ...(highlighted && {...styles.highlighted})
  }

  const sharedTextStyle = {
      color : messageFrom ? customStyle.sentTextColor : customStyle.receivedTextColor,
      fontSize : customStyle.messageFontSize
  }

  const handleCopyPress = text => {
    Clipboard.setString(text);
    setShowCopyConfirmation(true);
    setTimeout(() => {
      setShowCopyConfirmation(false);
    },500)
  }

  return (
    <TouchableOpacity
    onLayout={onLayout}
    disabled={disableTouch}
    activeOpacity={activeOpacity}
    onLongPress={onLongPress}
    onPress={onPress}
    style={boxStyle}>
      <View style={{flexDirection : messageFrom ? "row" : "row-reverse"}}>
        {showCopyButton &&
        <TouchableOpacity onPress={() => handleCopyPress(text)} style={{
          ...styles.copyButton,
          ...(messageFrom ? {marginRight : 20} : {marginLeft : 20})
        }}>
          <Icon name={showCopyConfirmation ? "check" : "content-copy"} size={36} color={palette.white}></Icon >
        </TouchableOpacity>}
        <View style={styles.textContainer}>
          <Text
          style={{...sharedTextStyle, ...styles.text, fontSize : textFontSize}}>
            {text}
          </Text>
          <Text
          style={{...sharedTextStyle, ...styles.timestamp }}>
            {timestamp}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = {
  messageFromOther : {
    maxWidth: "90%",
    alignSelf : "flex-start",
    marginLeft : 5,
  },
  messageFromYou : {
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
  },
  copyButton : {
    alignSelf : "center",
  },
  textContainer : {
    overflow : "hidden",
    flexShrink : 1
  }
}

export default memo(ChatBubble)
