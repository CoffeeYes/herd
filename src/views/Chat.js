import React, { useState } from 'react';
import { Text, View, ScrollView } from 'react-native';

const Chat = ({ route, navigation }) => {
  const [messages,setMessages] = useState([
    {from : "other", text : "test from other"},
    {from : "you", text : "test from you"}
  ])
  return (
    <ScrollView>
      <View style={{backgroundColor : "white",paddingVertical : 15,paddingLeft : 10}}>
        <Text>{route.params.username}</Text>
      </View>
      {messages.map( (message,index) =>
        <View
        style={message.from === "other" ?
          {...styles.message,...styles.messageFromOther}
          :
          {...styles.message,...styles.messageFromYou}}
        key={index}>
          <Text style={styles.messageText}>{message.text}</Text>
        </View>
      )}
    </ScrollView>
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
    marginTop : 10,
    borderRadius : 10,
  },
  messageText : {
    color : "#f5f5f5"
  }
}

export default Chat;
