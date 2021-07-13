import React, { useState } from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { fromHsv, toHsv } from 'react-native-color-picker';

const ChatBubble = ({ text, timestamp, messageFrom, customStyle }) => {
  const [highlighted, setHighlighted] = useState(false);

  const invertColor = color => {
    var temp = toHsv(color);
    temp.h = 0.3 + (0.1* temp.h);
    temp.s = 0.3 + (0.1* temp.s);
    temp.v = 0.3 + (0.1* temp.v);
    temp.a = 0.3 + (0.1* temp.a);
    temp = fromHsv(temp);
    return temp;
  }

  return (
    <TouchableOpacity
    onLongPress={() => setHighlighted(true)}
    style={messageFrom ?
      {...styles.message,...styles.messageFromYou, backgroundColor : highlighted ?
        invertColor(customStyle.sentBoxColor)
        :
        customStyle.sentBoxColor
      }
      :
      {...styles.message,...styles.messageFromOther, backgroundColor : highlighted ?
        invertColor(customStyle.sentBoxColor)
        :
        customStyle.sentBoxColor}}>
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
