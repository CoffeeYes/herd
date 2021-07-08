import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text } from 'react-native';
import Header from './Header';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MessageQueue = ({}) => {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    loadMessages();
  },[])

  const loadMessages = async () => {
    const contacts = JSON.parse(await AsyncStorage.getItem("contacts"));
    var allMessages = [];

    for(var contact in contacts) {
      const currentMessages = JSON.parse(await AsyncStorage.getItem(contacts[contact].id)).sentCopy;
      allMessages = [...allMessages,...currentMessages];
    }
    setMessages(allMessages);
  }
  
  return (
    <View>
      <Header
      allowGoBack
      title="Message Queue"/>

      <ScrollView>
        {messages.map(message =>
          <View>
            <Text>{message.text}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

export default MessageQueue;
