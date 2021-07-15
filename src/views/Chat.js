import React, { useState, useEffect, useRef } from 'react';
import { Text, View, ScrollView, TextInput, ActivityIndicator,Image, Dimensions, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import Header from './Header';
import ChatBubble from './ChatBubble';

import Crypto from '../nativeWrapper/Crypto';

const Chat = ({ route, navigation }) => {
  const [messages,setMessages] = useState([]);
  const [contactInfo, setContactInfo] = useState({});
  const [ownPublicKey, setOwnPublicKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [chatInput, setChatInput] = useState("");
  const [customStyle, setCustomStyle] = useState({});
  const [highlightedMessages, setHighlightedMessages] = useState([]);

  useEffect(() => {
    AsyncStorage.getItem("contacts").then(result => {
      result = JSON.parse(result);
      result &&
      setContactInfo(result.find(contact => contact.id === route.params.contactID))
    });
    Crypto.loadKeyFromKeystore("herdPersonal").then(key => setOwnPublicKey(key))
    loadMessages().then( () => setLoading(false));
    loadStyles();
  },[])

  const loadMessages = async () => {
    var userData = JSON.parse(await AsyncStorage.getItem(route.params.contactID));
    //set default user structure
    if(!userData) {
      userData = {
        sent : [],
        received : [],
        sentCopy : []
      }
    }

    var receivedMessages = userData.received;
    var sentMessagesCopy = userData.sentCopy;
    //decrypt all message text payloads (sent and received) using private key
    if(receivedMessages.length > 0) {
      for(var message in receivedMessages) {
        receivedMessages[message].text = await Crypto.decryptString(
          "herdPersonal",
          Crypto.algorithm.RSA,
          Crypto.blockMode.ECB,
          Crypto.padding.OAEP_SHA256_MGF1Padding,
          receivedMessages[message].text
        )
      }
    }

    if(sentMessagesCopy.length > 0) {
      for(var message in sentMessagesCopy) {
        sentMessagesCopy[message].text = await Crypto.decryptString(
          "herdPersonal",
          Crypto.algorithm.RSA,
          Crypto.blockMode.ECB,
          Crypto.padding.OAEP_SHA256_MGF1Padding,
          sentMessagesCopy[message].text
        )
      }
    }

    (receivedMessages.length > 0 || sentMessagesCopy.length > 0) &&
    setMessages([...receivedMessages,...sentMessagesCopy].sort( (a,b) => a.timestamp > b.timestamp))
  }

  const loadStyles = async () => {
    const style = JSON.parse(await AsyncStorage.getItem("styles"));
    setCustomStyle(style)
  }

  const sendMessage = async message => {
    var userData = JSON.parse(await AsyncStorage.getItem(route.params.contactID));
    //default userData if there is none
    if(!userData) {
      userData = {
        sent : [],
        received : [],
        sentCopy : []
      }
    }
    //plaintext copy of the message to immediatly append to chat state
    const plainText = {
      to : contactInfo.key,
      from : ownPublicKey,
      text : message,
      timestamp : Date.now()
    }

    //encrypt the message to be sent using the other users public key
    const newMessageEncrypted = await Crypto.encryptStringWithKey(
      contactInfo.key,
      Crypto.algorithm.RSA,
      Crypto.blockMode.ECB,
      Crypto.padding.OAEP_SHA256_MGF1Padding,
      message
    )
    //store new message to be sent
    var sentMessages = JSON.parse(await AsyncStorage.getItem(route.params.contactID))
    if(!sentMessages) {
      sentMessages = []
    }
    userData.sent.push(sentMessages);

    //encrypt the passed in message using the users own public key
    const newMessageEncryptedCopy = await Crypto.encryptString(
      "herdPersonal",
      Crypto.algorithm.RSA,
      Crypto.blockMode.ECB,
      Crypto.padding.OAEP_SHA256_MGF1Padding,
      message
    )

    //create a message object with relevant metadata
    const messageToAddCopy = {
      to : contactInfo.key,
      from : ownPublicKey,
      text : newMessageEncryptedCopy,
      timestamp : Date.now()
    }
    userData.sentCopy.push(messageToAddCopy);
    await AsyncStorage.setItem(route.params.contactID,JSON.stringify(userData))

    setMessages([...messages,plainText])
    setChatInput("");
    scrollRef.current.scrollToEnd({animated : true})
  }

  const longPressMessage = () => {

  }

  const scrollRef = useRef();

  return (
    <>
    <Header
    title={contactInfo?.name}
    touchStyle={{backgroundColor : "#f46758"}}
    textStyle={{marginLeft : 10}}
    allowGoBack
    onTextTouch={() => navigation.navigate("contact", {
      id : contactInfo.id
    })}
    preText={
      contactInfo?.image?.length > 0 &&
      <View style={styles.imageContainer}>
      <Image
      source={{uri : contactInfo.image}}
      style={styles.image}/>
      </View>
    }/>
    <View style={{flex : 1}}>

      {loading && <ActivityIndicator size="large" color="#e05e3f"/>}

      <ScrollView
      contentContainerStyle={styles.messageContainer}
      ref={scrollRef}
      onLayout={() => scrollRef.current.scrollToEnd({animated : true})}>
        {messages.map( (message,index) =>
          <ChatBubble
          text={message.text}
          timestamp={moment(message.timestamp).format("HH:mm - DD.MM")}
          messageFrom={message.from === ownPublicKey}
          key={index}
          identifier={index}
          customStyle={customStyle}
          highlightedMessages={highlightedMessages}
          setHighlightedMessages={setHighlightedMessages}
          />
        )}
      </ScrollView>

      <TextInput
      placeholder="Send a Message"
      style={styles.chatInput}
      value={chatInput}
      onChangeText={setChatInput}
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
}

export default Chat;
