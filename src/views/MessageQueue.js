import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, Dimensions, ActivityIndicator } from 'react-native';
import Header from './Header';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMessageQueue } from '../realm/chatRealm';
import { getContactsByKey } from '../realm/contactRealm';
import moment from 'moment';

import Crypto from '../nativeWrapper/Crypto';

import FoldableMessage from './FoldableMessage';

const MessageQueue = ({}) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ownPublicKey, setOwnPublicKey] = useState("");

  useEffect(() => {
    loadMessages();
    setLoading(false);
    Crypto.loadKeyFromKeystore("herdPersonal").then(key => setOwnPublicKey(key));
  },[])

  const loadMessages = () => {
    const messageQueue = getMessageQueue();
    var contactKeys = [];
    //get unique public keys from messages
    contactKeys = messageQueue.map(message => contactKeys.indexOf(message.to) === -1 && message.to);
    //find relevant contacts based on public keys
    const contacts = getContactsByKey(contactKeys);
    //add contact names to messages using matching contact and message public key
    messageQueue.map(message => message.toContactName = contacts.find(contact => message.to === contact.key)?.name)
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
          message.to === ownPublicKey || message.from === ownPublicKey ?
          <FoldableMessage
          to={message.toContactName}
          style={styles.messageItem}
          key={index}
          timestamp={moment(message.timestamp).format("HH:MM (DD/MM/YY)")}
          text={message.text}/>
          :
          <Text key={index}>Encrypted Message for Other User</Text>
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
