import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { View, Text, Dimensions, ActivityIndicator, FlatList } from 'react-native';
import Header from './Header';

import Crypto from '../nativeWrapper/Crypto';

import FoldableMessage from './FoldableMessage';
import CustomButton from './CustomButton';

import { palette } from '../assets/palette';

import { timestampToText } from '../helper.js';

import moment from 'moment';

const MessageQueue = ({}) => {
  const [openMessages, setOpenMessages] = useState([]);
  const ownPublicKey = useSelector(state => state.userReducer.publicKey);
  const messageQueue = useSelector(state => state.chatReducer.messageQueue);
  const contacts = useSelector(state => state.contactReducer.contacts);
  const customStyle = useSelector(state => state.chatReducer.styles);
  const [parsedQueue, setParsedQueue] = useState(messageQueue);
  const [loading, setLoading] = useState(true);

  const parseMessageQueue = async queue => {
    const parsedQueue = await Promise.all(queue.map( async message => {
      let newMessage = {...message};
      let textToDecrypt = false;
      const pairs = {"to" : "toContactName", "from" : "fromContactName"};

      for(const [key,value] of Object.entries(pairs)) {
        if(newMessage[key].trim() === ownPublicKey.trim()) {
          newMessage[value] = "You";
          textToDecrypt = true;
        }
        else {
          newMessage[value] = contacts.find(contact => message[key].trim() === contact.key)?.name || "Unknown"
        }
      }

      if(textToDecrypt) {
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
    return parsedQueue.sort((a,b) => a.timestamp < b.timestamp);
  }

  useEffect(() => {
    ( async () => {
      setLoading(true);
      setParsedQueue(await parseMessageQueue(messageQueue))
      setLoading(false);
    })()
  },[messageQueue])

  const onMessagePress = useCallback(id => {
    setOpenMessages(oldOpenMessages => oldOpenMessages.includes(id) ?
    oldOpenMessages.filter(item => item != id)
    :
    [...oldOpenMessages,id])
  },[])

  const renderItemCallback = useCallback( ({ item }) => {
    return renderItem({ item })
  },[parsedQueue,loading,openMessages])

  const renderItem = ({ item }) => {
    const date = timestampToText(item.timestamp, "DD/MM/YY");
    const hours = moment(item.timestamp).format("HH:MM");

    return (
      <FoldableMessage
      to={item.toContactName}
      from={item.fromContactName}
      open={openMessages.includes(item._id)}
      onPress={() => onMessagePress(item._id)}
      loading={loading}
      closedTimestamp={date}
      openTimestamp={hours}
      textFontSize={customStyle.uiFontSize}
      text={item.text}/>
    )
  }

  return (
    <View style={{flex : 1}}>
      <Header
      allowGoBack
      title="Message Queue"/>

      <CustomButton
      text={openMessages.length > 0 ? "Close All" : "Open All"}
      onPress={() => {
        setOpenMessages(openMessages.length > 0 ? [] : messageQueue.map(message => message._id))
      }}
      disabled={loading}
      buttonStyle={styles.buttonStyle}/>

      <FlatList
      contentContainerStyle={styles.listStyle}
      data={parsedQueue}
      keyExtractor={item => item._id}
      renderItem={renderItemCallback}/>
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
  },
  buttonStyle : {
    marginTop : 10,
    elevation : 2,
    borderColor : palette.offprimary,
    marginBottom : 10
  },
  listStyle : {
    alignItems : "center",
    paddingVertical : 10,
  }
}
export default MessageQueue;
