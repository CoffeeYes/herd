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
  const contacts = useSelector(state => state.contactReducer.contacts);

  const parseMessageQueue = queue => {
    queue.map(message => {
      message.toContactName = message.to.trim() === ownPublicKey.trim() ?
        "You"
        :
        contacts.find(contact => message.to.trim() === contact.key)?.name || "Unknown"

      message.fromContactName = message.from.trim() === ownPublicKey.trim() ?
        "You"
        :
        contacts.find(contact => message.from.trim() === contact.key)?.name || "Unknown"
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
          message.to.trim() === ownPublicKey.trim() || message.from.trim() === ownPublicKey.trim() ?
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
          to="N/A"
          from="N/A"
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
