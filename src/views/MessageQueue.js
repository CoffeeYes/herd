import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text } from 'react-native';
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

    for(var contact in contacts) {
      const currentMessages = JSON.parse(await AsyncStorage.getItem(contacts[contact].id)).sentCopy;
      allMessages = [...allMessages,...currentMessages];
    }

    for(var message in allMessages) {
      allMessages[message].text = await Crypto.decryptString(
        "herdPersonal",
        Crypto.algorithm.RSA,
        Crypto.blockMode.ECB,
        Crypto.padding.OAEP_SHA256_MGF1Padding,
        allMessages[message].text
      )
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
