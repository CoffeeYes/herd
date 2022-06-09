import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { View, ScrollView, Text, Dimensions, ActivityIndicator } from 'react-native';
import Header from './Header';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMessageQueue } from '../realm/chatRealm';
import { getContactsByKey } from '../realm/contactRealm';
import moment from 'moment';

import Crypto from '../nativeWrapper/Crypto';

import FoldableMessage from './FoldableMessage';

import { setMessageQueue } from '../redux/actions/chatActions';
const MessageQueue = ({}) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const ownPublicKey = useSelector(state => state.userReducer.publicKey);
  const messageQueue = useSelector(state => state.chatReducer.messageQueue);

  useEffect(() => {
    loadMessages();
  },[])

  const loadMessages = async () => {
    setLoading(true);
    const messageQueue = await getMessageQueue(true);
    var contactKeys = [];
    //get unique public keys from messages
    contactKeys = messageQueue.map(message => contactKeys.indexOf(message.to) === -1 && message.to);
    //find relevant contacts based on public keys
    const contacts = getContactsByKey(contactKeys);
    //add contact names to messages using matching contact and message public key
    messageQueue.map(message => {
      message.toContactName = message.to === ownPublicKey ?
        "You"
        :
        contacts.find(contact => message.to === contact.key)?.name

      message.fromContactName = message.from === ownPublicKey ?
        "You"
        :
        contacts.find(contact => message.from === contact.key)?.name
    })
    dispatch(setMessageQueue(messageQueue))
    setLoading(false);
  }

  return (
    <View style={{flex : 1}}>
      <Header
      allowGoBack
      title="Message Queue"/>

      {loading ?
      <ActivityIndicator size="large" color="#e05e3f"/>
      :
      <ScrollView contentContainerStyle={{alignItems : "center",paddingVertical : 10}}>
        {messageQueue.map((message,index) =>
          message.to === ownPublicKey || message.from === ownPublicKey ?
          <FoldableMessage
          to={message.toContactName}
          from={message.fromContactName}
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
  messageTo : {
    fontWeight : "bold",
    marginRight : 10
  },
  messageText : {
    width : Dimensions.get('window').width * 0.7,
  }
}
export default MessageQueue;
