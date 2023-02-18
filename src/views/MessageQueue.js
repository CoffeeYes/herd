import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { View, Text, Dimensions, ActivityIndicator, FlatList } from 'react-native';
import Header from './Header';
import moment from 'moment';

import Crypto from '../nativeWrapper/Crypto';

import FoldableMessage from './FoldableMessage';
import CustomButton from './CustomButton';

import { palette } from '../assets/palette';

const MessageQueue = ({}) => {
  const [openMessages, setOpenMessages] = useState([]);
  const ownPublicKey = useSelector(state => state.userReducer.publicKey);
  const messageQueue = useSelector(state => state.chatReducer.messageQueue);
  const contacts = useSelector(state => state.contactReducer.contacts);
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
    setLoading(true);
    ( async () => {
      setParsedQueue(await parseMessageQueue(messageQueue))
    })()
    setLoading(false);
  },[messageQueue])

  const onMessagePress = index => {
    const newOpenMessages = openMessages.indexOf(index) == -1 ?
      [...openMessages,index]
      :
      openMessages.filter(item => item != index)
    setOpenMessages(newOpenMessages)
  }

  const renderItem = ({item, index}) => {
    return (
      <FoldableMessage
      to={item.toContactName}
      from={item.fromContactName}
      open={openMessages.indexOf(index) != -1}
      onPress={() => onMessagePress(index)}
      key={index}
      loading={loading}
      timestamp={moment(item.timestamp).format("HH:MM (DD/MM/YY)")}
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
        setOpenMessages(openMessages.length > 0 ? [] : messageQueue.map((message,index) => index))
      }}
      disabled={loading}
      buttonStyle={styles.buttonStyle}/>

      <FlatList
      contentContainerStyle={styles.listStyle}
      data={parsedQueue}
      keyExtractor={item => item._id}
      renderItem={renderItem}/>
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
