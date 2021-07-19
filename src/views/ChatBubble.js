import React, { useState } from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { fromHsv, toHsv } from 'react-native-color-picker';

const ChatBubble = ({ text, timestamp, messageFrom, customStyle, identifier,
                      highlightedMessages, setHighlightedMessages }) => {
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

  const highlight = () => {
    setHighlighted(true);
    highlightedMessages.indexOf(identifier) === -1 &&
    setHighlightedMessages([...highlightedMessages,identifier])
  }

  const unhighlight = () => {
    if(highlighted) {
      setHighlighted(false)
      setHighlightedMessages([...highlightedMessages].filter(item => item !== identifier))
    }
  }

  return (
    <TouchableOpacity
    onLongPress={highlight}
    onPress={() => highlighted ? unhighlight() : highlightedMessages.length > 0 && highlight()}
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
    marginLeft : 5,
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
  highlighted : {
    borderWidth : 2,
    borderColor : "black",
    borderStyle : "dotted"
  }
}

export default ChatBubble
