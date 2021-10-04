import React, { useState, useEffect, useRef } from 'react';
import { Text, View, ScrollView, TextInput, ActivityIndicator,
         Image, Dimensions, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import Realm from 'realm';
import {
  getMessagesWithContact,
  sendMessageToContact,
  deleteMessages as deleteMessagesFromRealm} from '../realm/chatRealm';
import { getContactById } from '../realm/contactRealm';
import { parseRealmID } from '../realm/helper';

import Header from './Header';
import ChatBubble from './ChatBubble';

import Crypto from '../nativeWrapper/Crypto';
import Schemas from '../Schemas'

const Chat = ({ route, navigation }) => {
  const [messages,setMessages] = useState([]);
  const [contactInfo, setContactInfo] = useState({});
  const [ownPublicKey, setOwnPublicKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [chatInput, setChatInput] = useState("");
  const [customStyle, setCustomStyle] = useState({});
  const [highlightedMessages, setHighlightedMessages] = useState([]);
  const [inputDisabled, setInputDisabled] = useState(false);
  const [messageDays, setMessageDays] = useState([]);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [messageCount, setMessageCount] = useState(-5);

  useEffect(() => {
    (async () => {
      setOwnPublicKey(await Crypto.loadKeyFromKeystore("herdPersonal"))
      await loadMessages(messageCount);
      await loadStyles();
      setLoading(false);
    })()
  },[]);

  const loadMessages = async messageCount => {
    const contact = getContactById(route.params.contactID);
    setContactInfo(contact);
    const messages = await getMessagesWithContact(contact.key,messageCount);
    setMessageDays(calculateMessageDays(messages));
    setMessages(messages);
  }

  const calculateMessageDays = messages => {
    var dates = [];
    for(var message in messages) {
      let messageDate = moment(messages[message].timestamp).format("DD/MM");
      dates.indexOf(messageDate) === -1 &&
      dates.push(messageDate)
    }
    return dates
  }

  const loadStyles = async () => {
    const style = JSON.parse(await AsyncStorage.getItem("styles"));
    setCustomStyle(style)
  }

  const sendMessage = async message => {
    if(message.trim() === "") return;
    setInputDisabled(true);

    //plaintext copy of the message to immediatly append to chat state
    const plainText = {
      to : contactInfo.key,
      from : ownPublicKey,
      text : message,
      timestamp : Date.now(),
    }
    scrollRef.current.scrollToEnd({animated : true})

    //encrypt the message to be sent using the other users public key
    const newMessageEncrypted = await Crypto.encryptStringWithKey(
      contactInfo.key,
      Crypto.algorithm.RSA,
      Crypto.blockMode.ECB,
      Crypto.padding.OAEP_SHA256_MGF1Padding,
      message
    )

    //encrypt the passed in message using the users own public key
    const newMessageEncryptedCopy = await Crypto.encryptString(
      "herdPersonal",
      Crypto.algorithm.RSA,
      Crypto.blockMode.ECB,
      Crypto.padding.OAEP_SHA256_MGF1Padding,
      message
    )

    //create a message object with relevant metadata
    const metaData = {
      to : contactInfo.key,
      from : ownPublicKey,
      timestamp : Date.now()
    }
    //add message to UI
    let messageID = sendMessageToContact(metaData, newMessageEncrypted, newMessageEncryptedCopy);
    setMessages([...messages,{...plainText,_id : messageID}]);
    const newDate = moment(metaData.timestamp).format("DD/MM");

    messageDays.indexOf(newDate) === -1 &&
    setMessageDays([...messageDays,newDate]);

    setChatInput("");
    setInputDisabled(false);
  }

  const deleteMessages = () => {
    Alert.alert(
      'Are you sure you want to delete these messages?',
      '',
      [
        { text: "Cancel", style: 'cancel', onPress: () => {} },
        {
          text: 'Delete',
          style: 'destructive',
          // If the user confirmed, then we dispatch the action we blocked earlier
          // This will continue the action that had triggered the removal of the screen
          onPress: async () => {
            setInputDisabled(true);
            deleteMessagesFromRealm(highlightedMessages);
            setHighlightedMessages([]);
            const messages = await getMessagesWithContact(contactInfo.key);
            setMessageDays(calculateMessageDays(messages));
            setMessages(messages);
            setInputDisabled(false);
          },
        },
      ]
    );
  }

  const handleScroll = event => {
    let pos = event.nativeEvent.contentOffset.y
    if(pos === 0) {
      loadMessages(messageCount - 5);
      setMessageCount(messageCount - 5);
    }
  }

  const scrollRef = useRef();

  return (
    <>
    <Header
    title={contactInfo.name}
    touchStyle={{backgroundColor : "#f46758"}}
    textStyle={{marginLeft : 10}}
    rightButtonIcon={highlightedMessages.length > 0 && "delete"}
    rightButtonOnClick={deleteMessages}
    allowGoBack
    onTextTouch={() => navigation.navigate("contact", {id : parseRealmID(contactInfo)})}
    preText={
      contactInfo?.image?.length > 0 &&
      <View style={styles.imageContainer}>
      <Image
      source={{uri : contactInfo.image}}
      style={styles.image}/>
      </View>
    }/>
    <View style={{flex : 1}}>

      {loading ?
      <ActivityIndicator size="large" color="#e05e3f"/>
      :
      <ScrollView
      contentContainerStyle={styles.messageContainer}
      onScroll={handleScroll}
      ref={scrollRef}
      onLayout={() => scrollRef.current.scrollToEnd({animated : true})}>
        {messageDays.map((day,index) =>
          <View key={index}>
            <Text style={styles.messageDay}>{day === moment().format("DD/MM") ? "Today" : day}</Text>
            {messages.map(message => moment(message.timestamp).format("DD/MM") === day &&
              <ChatBubble
              text={message.text}
              timestamp={moment(message.timestamp).format("HH:mm - DD.MM")}
              messageFrom={message.from === ownPublicKey}
              key={parseRealmID(message)}
              identifier={parseRealmID(message)}
              customStyle={customStyle}
              highlightedMessages={highlightedMessages}
              setHighlightedMessages={setHighlightedMessages}
              />
            )}
          </View>
        )}
      </ScrollView>}

      <TextInput
      placeholder="Send a Message"
      style={{
        ...styles.chatInput,
        backgroundColor : inputDisabled ? "#c6c6c6" : "white",
        fontSize : customStyle.fontSize
      }}
      value={chatInput}
      editable={!inputDisabled}
      onChangeText={setChatInput}
      multiline={true}
      blurOnSubmit={true}
      onKeyPress={({nativeEvent}) => nativeEvent.key === "Enter" && this.submit()}
      onSubmitEditing={event => sendMessage(event.nativeEvent.text)}/>
    </View>
    </>
  )
}

const styles = {
  chatInput : {
    backgroundColor : "white",
    marginTop : "auto",
    paddingLeft : 10
  },
  imageContainer : {
    borderWidth : 1,
    borderColor : "grey",
    width : Dimensions.get("window").width * 0.1,
    height : Dimensions.get("window").width * 0.1,
    marginLeft : 10,
    borderRadius : Dimensions.get("window").width * 0.05,
    overflow : "hidden",
    alignSelf : "center",
    alignItems : "center",
    justifyContent : "center",
    marginRight : 20
  },
  image : {
    width : Dimensions.get("window").width * 0.1,
    height : Dimensions.get("window").width * 0.1,
  },
  messageDay : {
    alignSelf : "center"
  }
}

export default Chat;
