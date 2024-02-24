import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { View, Dimensions, FlatList, InteractionManager } from 'react-native';
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
  const [parsedQueue, setParsedQueue] = useState(
    messageQueue.sort( (a,b) => a.timestamp - b.timestamp)
    .map(message => ({...message, loading : true}))
  );

  const assignParticipantsToMessage = message => {
    let textToDecrypt = false;

    for(const key of ["to","from"]) {
      const longKey = key + "ContactName";
      //if sender or receiver is oneself, replace name with "You" and mark the message as needing to be decrypted
      if(message[key].trim() === ownPublicKey.trim()) {
        message[longKey] = "You";
        textToDecrypt = true;
      }
      //find the matching contacts name, if no contact for that message is saved mark it as unknown
      else {
        message[longKey] = contacts.find(contact => message[key].trim() === contact.key)?.name || "Unknown"
      }
    }

    return [message,textToDecrypt];
  }

  const decryptMessages = queue => {
    queue.forEach( async (message,index) => {

      let [newMessage, textToDecrypt] = assignParticipantsToMessage({...message})

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
      newMessage.loading = false;
      setParsedQueue(oldQueue => {
        let updatedQueue = [...oldQueue];
        updatedQueue[index] = newMessage;
        return updatedQueue
      })
    })
  }

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => decryptMessages(parsedQueue));
  },[])

  const onMessagePress = useCallback(id => {
    setOpenMessages(oldOpenMessages => oldOpenMessages.includes(id) ?
    oldOpenMessages.filter(item => item != id)
    :
    [...oldOpenMessages,id])
  },[])

  const renderItem = useCallback(({ item }) => {
    const date = timestampToText(item.timestamp, "DD/MM/YY");
    const hours = moment(item.timestamp).format("HH:MM");

    return (
      <FoldableMessage
      containerStyle={{width : "80%"}}
      to={item.toContactName}
      from={item.fromContactName}
      open={openMessages.includes(item._id)}
      onPress={() => onMessagePress(item._id)}
      loading={item.loading}
      closedTimestamp={date}
      openTimestamp={hours}
      textFontSize={customStyle.scaledUIFontSize}
      headerTitleStyle={{fontSize : customStyle.scaledUIFontSize}}
      headerTextStyle={{fontSize : customStyle.scaledUIFontSize}}
      text={item.text}/>
    )
  },[parsedQueue,openMessages, Dimensions.get("window").width])

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
      useLoadingIndicator
      loading={parsedQueue.some(item => item.loading)}
      disabled={parsedQueue.some(item => item.loading)}
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
  buttonStyle : {
    marginTop : 10,
    elevation : 2,
    borderColor : palette.offprimary,
    marginBottom : 10,
    width : "50%"
  },
  listStyle : {
    alignItems : "center",
    paddingVertical : 10,
  }
}
export default MessageQueue;
