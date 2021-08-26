import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, Dimensions, ActivityIndicator } from 'react-native';
import Header from './Header';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMessageQueue } from '../realm/chatRealm';

import Crypto from '../nativeWrapper/Crypto';

const MessageQueue = ({}) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMessages();
    setLoading(false);
  },[])

  const loadMessages = () => {
    const messageQueue = getMessageQueue();
    setMessages(messageQueue)
  }

  return (
    <View>
      <Header
      allowGoBack
      title="Message Queue"/>

      {loading ?
      <ActivityIndicator size="large" color="#e05e3f"/>
      :
      <ScrollView>
        {messages.map((message,index) =>
          <View style={styles.messageItem} key={index}>
            <Text style={styles.messageTo}>To: {message.toContactName}</Text>
            <Text style={styles.messageText}>{message.text}</Text>
          </View>
        )}
      </ScrollView>}
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
