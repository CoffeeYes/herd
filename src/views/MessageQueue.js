import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { View, ScrollView, Text, Dimensions } from 'react-native';
import Header from './Header';
import moment from 'moment';

import Crypto from '../nativeWrapper/Crypto';

import FoldableMessage from './FoldableMessage';
import CustomButton from './CustomButton';

const MessageQueue = ({}) => {
  const [openMessages, setOpenMessages] = useState([]);
  const ownPublicKey = useSelector(state => state.userReducer.publicKey);
  const messageQueue = useSelector(state => state.chatReducer.messageQueue);
  const contacts = useSelector(state => state.contactReducer.contacts);
  const [parsedQueue, setParsedQueue] = useState([]);

  const parseMessageQueue = async queue => {
    const parsedQueue = await Promise.all(queue.map( async message => {
      let newMessage = {...message};
      newMessage.toContactName = message.to.trim() === ownPublicKey.trim() ?
      "You"
      :
      contacts.find(contact => message.to.trim() === contact.key)?.name || "Unknown"

      newMessage.fromContactName = message.from.trim() === ownPublicKey.trim() ?
      "You"
      :
      contacts.find(contact => message.from.trim() === contact.key)?.name || "Unknown"

      if(message.to.trim() === ownPublicKey.trim() || message.from.trim() === ownPublicKey.trim()) {
        newMessage.text = await Crypto.decryptString(
          "herdPersonal",
          Crypto.algorithm.RSA,
          Crypto.blockMode.ECB,
          Crypto.padding.OAEP_SHA256_MGF1Padding,
          message.text
        )
      }
      else {
        newMessage.text = "Encrypted message for other user"
        newMessage.toContactName = "N/A";
        newMessage.fromContactName = "N/A";
      }
      return newMessage;
    }))
    return parsedQueue;
  }

  useEffect(() => {
    ( async () => {
      setParsedQueue(await parseMessageQueue(messageQueue))
    })()
  },[messageQueue])

  const onMessagePress = index => {
    const newOpenMessages = openMessages.indexOf(index) == -1 ?
      [...openMessages,index]
      :
      openMessages.filter(item => item != index)
    setOpenMessages(newOpenMessages)
  }

  return (
    <View style={{flex : 1}}>
      <Header
      allowGoBack
      title="Message Queue"/>

      <CustomButton
      text={openMessages.length > 0 ? "Close All" : "Open All"}
      onPress={() => {
        setOpenMessages(openMessages.length > 0 ? [] : messageQueue.map((message,index) => index))
      }}
      buttonStyle={{marginTop : 15}}/>
      <ScrollView contentContainerStyle={{alignItems : "center",paddingVertical : 10}}>
        {parsedQueue.map((message,index) =>
          <FoldableMessage
          to={message.toContactName}
          from={message.fromContactName}
          open={openMessages.indexOf(index) != -1}
          onPress={() => onMessagePress(index)}
          key={index}
          timestamp={moment(message.timestamp).format("HH:MM (DD/MM/YY)")}
          text={message.text}/>
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
