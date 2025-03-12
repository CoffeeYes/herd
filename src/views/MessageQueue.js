import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { View, Text, Dimensions, FlatList } from 'react-native';
import Header from './Header';
import Crypto from '../nativeWrapper/Crypto';

import FoldableMessage from './FoldableMessage';
import CustomButton from './CustomButton';
import Card from './Card';

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
  const [parsedQueue, setParsedQueue] = useState(messageQueue);
  const [sorting, setSorting] = useState("Oldest")

  const initialNumToRender = 10;

  const assignParticipantsToMessage = message => {
    let textToDecrypt = false;

    if(message.to.trim() === ownPublicKey.trim()) {
      message.toContactName = "You";
      message.fromContactName = contacts.find(contact => message.from.trim() === contact.key)?.name || "Unknown";
      textToDecrypt = true;
    }
    else if(message.from.trim() === ownPublicKey.trim()) {
      message.fromContactName = "You";
      message.toContactName= contacts.find(contact => message.to.trim() === contact.key)?.name || "Unknown";
      textToDecrypt = true;
    }

    return [message,textToDecrypt];
  }

  const createInitialMessageState = messages => {
    return messages.sort((a,b) => a.timestamp - b.timestamp)
    .map(message => {
      let [messageWithContact,canBeDecrypted] = assignParticipantsToMessage(message)
      return ({...messageWithContact, loading : canBeDecrypted})
    })
  }

  const assignResultsToTargets = (decryptedMessages, targets) => {
    for(const decryptedMessage of decryptedMessages) {
      const index = parseInt(decryptedMessage.identifier);
      targets[index] = {...targets[index], text : decryptedMessage.text, loading : false}
    }
    return targets;
  }

  const onMessagePress = useCallback(id => {
    setOpenMessages(oldOpenMessages => oldOpenMessages.includes(id) ?
    oldOpenMessages.filter(item => item != id)
    :
    [...oldOpenMessages,id])
  },[])

  useEffect(() => {
    (async () => {
      const initialMessages = createInitialMessageState(messageQueue);
      setParsedQueue(initialMessages);
      const messagesToDecrypt = initialMessages.reduce((result, message, index) => {
        if(message.loading) {
          result.push(({text : message.text, identifier : index.toString()}))
        }
        return result;
      },[]);
      const results = await decryptStringsWithIdentifier(messagesToDecrypt)
      const final = assignResultsToTargets(results,[...parsedQueue]);
      setParsedQueue(final);
    })()

    return () => {
      Crypto.cancelCoroutineWork();
    }
  },[])

  const renderItem = useCallback(({ item }) => {
    const date = timestampToText(item.timestamp, "DD/MM/YY");
    const hours = moment(item.timestamp).format("HH:MM");

    const messageIsForUser = item.toContactName == "You" || item.fromContactName == "You";

    return (
      messageIsForUser ?
      <FoldableMessage
      containerStyle={{width : "80%"}}
      to={item.toContactName}
      from={item.fromContactName}
      open={openMessages.includes(item._id)}
      onPress={() => onMessagePress(item._id)}
      loading={item.loading}
      disablePress={item.loading || !messageIsForUser}
      closedTimestamp={date}
      openTimestamp={hours}
      textFontSize={customStyle.scaledUIFontSize}
      headerTitleStyle={{fontSize : customStyle.scaledUIFontSize}}
      headerTextStyle={{fontSize : customStyle.scaledUIFontSize}}
      text={item.text}/>
      :
      <Card
      cardStyle={{flex : 0, marginVertical : 10, minWidth : "80%"}}
      disabled
      disabledStyle={{backgroundColor : palette.offgrey}}
      text="Message in transit for another user"
      textStyle={{marginTop : 0}}
      />
    )
  },[parsedQueue,openMessages, Dimensions.get("window").width])

  return (
    <>
      <Header
      allowGoBack
      title="Message Queue"/>

      <View style={styles.mainContainer}>

        <View style={styles.buttonContainer}>
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

          <CustomButton
          text={`Sort : ${sorting}`}
          onPress={() => {
              if(sorting == "Oldest") {
                setSorting("Newest");
                setParsedQueue([...parsedQueue].sort((a,b) => b.timestamp - a.timestamp))
              }
              else {
                setSorting("Oldest");
                setParsedQueue([...parsedQueue].sort((a,b) => a.timestamp - b.timestamp))
              }
            }}
          loading={parsedQueue.some(item => item.loading)}
          disabled={parsedQueue.some(item => item.loading) || messageQueue.length == 0}
          buttonStyle={{...styles.buttonStyle, marginLeft : 10}}/>
        </View>

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
  mainContainer : {
    flex : 1,
  },
  buttonStyle : {
    elevation : 2,
    borderColor : palette.offprimary,
    flex : 1
  },
  listStyle : {
    alignItems : "center",
    paddingVertical : 10,
  },
  buttonContainer : {
    flexDirection : "row",
    alignItems : "center",
    justifyContent : "center",
    marginVertical : 10,
    width : "80%",
    alignSelf : "center"
  }
}
export default MessageQueue;
