import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, Dimensions } from 'react-native';
import Header from './Header';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Crypto from '../nativeWrapper/Crypto';

const MessageQueue = ({}) => {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    loadMessages();
  },[])

  const loadMessages = async () => {
    const contacts = JSON.parse(await AsyncStorage.getItem("contacts"));
    var allMessages = [];
    //compile all messages into one array
    for(var contact in contacts) {
      const currentMessages = JSON.parse(await AsyncStorage.getItem(contacts[contact].id)).sentCopy;
      allMessages = [...allMessages,...currentMessages];
    }

    //decrypt message text and add contact name to messages
    for(var message in allMessages) {
      allMessages[message].text = await Crypto.decryptString(
        "herdPersonal",
        Crypto.algorithm.RSA,
        Crypto.blockMode.ECB,
        Crypto.padding.OAEP_SHA256_MGF1Padding,
        allMessages[message].text
      )
      allMessages[message].toContactName = contacts.find(contact => contact.key === allMessages[message].to)?.name
    }
    setMessages(allMessages.sort((a,b) => a.timestamp > b.timestamp));
  }

  return (
    <View>
      <Header
      allowGoBack
      title="Message Queue"/>

      <ScrollView>
        {messages.map((message,index) =>
          <View style={styles.messageItem} key={index}>
            <Text style={styles.messageTo}>To: {message.toContactName}</Text>
            <Text style={styles.messageText}>{message.text}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}
const styles = {
  messageItem : {
    flexDirection : "row",
    backgroudnColor : "white",
    borderBottomWidth : 1,
    borderBottomColor : "black",
    padding : 20,
    backgroundColor : "white",
  },
  messageTo : {
    fontWeight : "bold",
    marginRight : 10
  },
  messageText : {
    width : Dimensions.get('window').width * 0.7,
  }
}
export default MessageQueue;
