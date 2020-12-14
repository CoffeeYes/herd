import React, { useState, useEffect } from 'react';
import { Text, View, ScrollView, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Chat = ({ route, navigation }) => {
  const [messages,setMessages] = useState([
    {from : "other", text : "test from other"},
    {from : "you", text : "test from you"}
  ])

  useEffect(() => {
    AsyncStorage.getItem(route.params.username).then(result => {
      result?.messages && setMessages(result.messages)
    })
  },[])

  return (
    <View>
      <View style={{backgroundColor : "white",paddingVertical : 15,paddingLeft : 10}}>
        <Text>{route.params.username}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.messageContainer}>
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

      <TextInput placeholder="Send a Message" style={styles.chatInput}/>
    </View>
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
  },
  chatInput : {
    backgroundColor : "white",
    marginTop : "auto",
    paddingLeft : 10
  },
  messageContainer : {
    height : "100%"
  }
}

export default Chat;
