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
import CustomButton from './CustomButton';

import { setMessageQueue } from '../redux/actions/chatActions';
const MessageQueue = ({}) => {
  const dispatch = useDispatch();
  const [allOpen, setAllOpen] = useState(false);
  const ownPublicKey = useSelector(state => state.userReducer.publicKey);
  const messageQueue = useSelector(state => state.chatReducer.messageQueue);

  const parseMessageQueue = queue => {
    var contactKeys = [];
    //get unique public keys from messages
    contactKeys = queue.map(message => contactKeys.indexOf(message.to) === -1 && message.to);
    //find relevant contacts based on public keys
    const contacts = getContactsByKey(contactKeys);
    //add contact names to messages using matching contact and message public key
    queue.map(message => {
      message.toContactName = message.to === ownPublicKey ?
        "You"
        :
        contacts.find(contact => message.to === contact.key)?.name

      message.fromContactName = message.from === ownPublicKey ?
        "You"
        :
        contacts.find(contact => message.from === contact.key)?.name
    })
    return queue
  }

  return (
    <View style={{flex : 1}}>
      <Header
      allowGoBack
      title="Message Queue"/>

      <CustomButton
      text={allOpen ? "Close All" : "Open All"}
      onPress={() => setAllOpen(!allOpen)}
      buttonStyle={{marginTop : 15}}/>
      <ScrollView contentContainerStyle={{alignItems : "center",paddingVertical : 10}}>
        {parseMessageQueue(messageQueue).map((message,index) =>
          message.to === ownPublicKey || message.from === ownPublicKey ?
          <FoldableMessage
          to={message.toContactName}
          overRideOpen={allOpen}
          from={message.fromContactName}
          key={index}
          textEncrypted={true}
          timestamp={moment(message.timestamp).format("HH:MM (DD/MM/YY)")}
          text={message.text}/>
          :
          <FoldableMessage
          overRideOpen={allOpen}
          key={index}
          timestamp={moment(message.timestamp).format("HH:MM (DD/MM/YY)")}
          text="Encrypted Message for Other User"/>
        )}
      </ScrollView>
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
