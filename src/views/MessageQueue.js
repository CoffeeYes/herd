import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { View, Text, Dimensions, FlatList } from 'react-native';
import Header from './Header';

import FoldableMessage from './FoldableMessage';
import CustomButton from './CustomButton';

import { palette } from '../assets/palette';

import { timestampToText } from '../helper.js';

import { decryptStringsWithIdentifier } from '../common.js';

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

  const initialNumToRender = 10;

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

  const decryptMessages = async queue => {
    const messagesAssignedToContact = queue.map(message => {
      let [messageWithContact,canBeDecrypted] = assignParticipantsToMessage(message)
      return ({...messageWithContact, loading : canBeDecrypted})
    })
    const messagesToDecrypt = messagesAssignedToContact.map((message, index) => message.loading && ({text : message.text, identifier : index.toString()}))
    const result = await decryptStringsWithIdentifier(
      messagesToDecrypt
    )
    let updatedQueue = [...parsedQueue];
    for(const decryptedMessage of result) {
      const index = parseInt(decryptedMessage.identifier);
      updatedQueue[index] = {...updatedQueue[index], text : decryptedMessage.text, loading : false}
    }
    setParsedQueue(updatedQueue);
  }

  const onMessagePress = useCallback(id => {
    setOpenMessages(oldOpenMessages => oldOpenMessages.includes(id) ?
    oldOpenMessages.filter(item => item != id)
    :
    [...oldOpenMessages,id])
  },[])

  useEffect(() => {
    decryptMessages(parsedQueue)
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
      disablePress={item.loading}
      closedTimestamp={date}
      openTimestamp={hours}
      textFontSize={customStyle.scaledUIFontSize}
      headerTitleStyle={{fontSize : customStyle.scaledUIFontSize}}
      headerTextStyle={{fontSize : customStyle.scaledUIFontSize}}
      text={item.text}/>
    )
  },[parsedQueue,openMessages, Dimensions.get("window").width])

  return (
    <>
      <Header
      allowGoBack
      title="Message Queue"/>

      <View style={{flex : 1}}>
        <CustomButton
        text={openMessages.length > 0 ? "Close All" : "Open All"}
        onPress={() => {
          setOpenMessages(openMessages.length > 0 ? [] : messageQueue.map(message => message._id))
        }}
        useLoadingIndicator
        loading={parsedQueue.some(item => item.loading)}
        loadingIndicatorStyle={{marginLeft : "10%"}}
        loadingIndicatorColor={palette.white}
        disabled={parsedQueue.some(item => item.loading) || messageQueue.length == 0}
        buttonStyle={styles.buttonStyle}/>

        {messageQueue.length == 0 &&
        <View style={{alignItems : "center"}}>
          <Text style={{fontWeight : "bold"}}>No Messages in Queue</Text>
        </View>}

        <FlatList
        initialNumToRender={initialNumToRender}
        contentContainerStyle={styles.listStyle}
        data={parsedQueue}
        keyExtractor={item => item._id}
        renderItem={renderItem}/>
      </View>
    </>
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
