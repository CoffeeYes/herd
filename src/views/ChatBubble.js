import React, { useState } from 'react';
import { TouchableOpacity, Text } from 'react-native';


const ChatBubble = ({ text, timestamp, messageFrom, customStyle }) => {
  const [highlighted, setHighlighted] = useState(false);

  return (
    <TouchableOpacity
    onLongPress={() => setHighlighted(true)}
    style={messageFrom ?
      {...styles.message,...styles.messageFromYou, backgroundColor : customStyle.sentBoxColor}
      :
      {...styles.message,...styles.messageFromOther, backgroundColor : customStyle.receivedBoxColor}}>
      <Text
      style={{
        ...styles.messageText,
        color : messageFrom ? customStyle.sentTextColor : customStyle.receivedTextColor}}>
        {text}
      </Text>
      <Text style={{
      ...styles.timestamp,
      color : messageFrom ? customStyle.sentTextColor : customStyle.receivedTextColo}}>
        {timestamp}
      </Text>
    </TouchableOpacity>
  )
}

const styles = {
  messageFromOther : {
    backgroundColor : "#E86252",
    marginLeft : 5
  },
  messageFromYou : {
    backgroundColor : "#c6c6c6",
    alignSelf : "flex-end",
    marginRight : 5
  },
  message : {
    padding : 20,
    width : "50%",
    marginVertical : 5,
    borderRadius : 10,
  },
  messageText : {
    color : "#f5f5f5"
  },
  timestamp : {
    fontWeight : "bold",
    marginTop : 10
  },
}

export default ChatBubble
