import React, { useState, useEffect, useRef } from 'react';
import { Text, View, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';

import Crypto from '../nativeWrapper/Crypto';

const Chat = ({ route, navigation }) => {
  const [messages,setMessages] = useState([]);
  const [contactInfo, setContactInfo] = useState({});
  const [ownPublicKey, setOwnPublicKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [chatInput, setChatInput] = useState("");

  useEffect(() => {
    AsyncStorage.getItem("contacts").then(result => {
      result = JSON.parse(result);
      result &&
      setContactInfo(result.find(contact => contact.name === route.params.username))
    });
    Crypto.loadKeyFromKeystore("herdPersonal").then(key => setOwnPublicKey(key))
    loadMessages().then( () => setLoading(false))
  },[])

  const loadMessages = async () => {
    var receivedMessages = JSON.parse(await AsyncStorage.getItem(route.params.username));
    var sentMessagesCopy = JSON.parse(await AsyncStorage.getItem(route.params.username + "_sentCopy"))

    if(receivedMessages) {
      //decrypt all message text payloads (sent and received) using private key
      for(var message in receivedMessages) {
        receivedMessages[message].text = await Crypto.decryptString(
          "herdPersonal",
          Crypto.algorithm.RSA,
          Crypto.blockMode.ECB,
          Crypto.padding.OAEP_SHA256_MGF1Padding,
          receivedMessages[message].text
        )
      }
      for(var message in sentMessagesCopy) {
        sentMessagesCopy[message].text = await Crypto.decryptString(
          "herdPersonal",
          Crypto.algorithm.RSA,
          Crypto.blockMode.ECB,
          Crypto.padding.OAEP_SHA256_MGF1Padding,
          sentMessagesCopy[message].text
        )
      }
      setMessages([...receivedMessages,...sentMessagesCopy].sort( (a,b) => a.timestamp > b.timestamp))
    }
  }

  const sendMessage = async message => {

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
    var sentMessages = JSON.parse(await AsyncStorage.getItem(route.params.username))
    if(!sentMessages) {
      sentMessages = []
    }
    await AsyncStorage.setItem(
      route.params.username + "_sent",
      JSON.stringify([...sentMessages,newMessageEncrypted])
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
    const messageToAddCopy = {
      to : contactInfo.key,
      from : ownPublicKey,
      text : newMessageEncryptedCopy,
      timestamp : Date.now()
    }

    //load the existing messages with this user and append our new message
    var sentMessagesCopy = JSON.parse(await AsyncStorage.getItem(route.params.username + "_sentCopy"));
    if(!sentMessagesCopy) {
      sentMessagesCopy = []
    }
    //store the new copy
    await AsyncStorage.setItem(
      route.params.username + "_sentCopy",
      JSON.stringify([...sentMessagesCopy,messageToAddCopy])
    )

    setMessages([...messages,plainText])
    setChatInput("");
    scrollRef.current.scrollToEnd({animated : true})
  }

  const scrollRef = useRef();

  return (
    <View style={{flex : 1}}>
      <View style={{backgroundColor : "#e05e3f",paddingVertical : 15,paddingLeft : 10}}>
        <Text style={{color : "white",fontSize : 18}}>{route.params.username}</Text>
      </View>
      {loading && <ActivityIndicator size="large" color="#e05e3f"/>}
      <ScrollView
      contentContainerStyle={styles.messageContainer}
      ref={scrollRef}
      onLayout={() => scrollRef.current.scrollToEnd({animated : true})}>
        {messages.map( (message,index) =>
          <View
          style={message.from === ownPublicKey ?
            {...styles.message,...styles.messageFromYou}
            :
            {...styles.message,...styles.messageFromOther}}
          key={index}>
            <Text style={styles.messageText}>{message.text}</Text>
            <Text style={styles.timestamp}>{moment(message.timestamp).format("HH:mm - DD.MM")}</Text>
          </View>
        )}
      </ScrollView>

      <TextInput
      placeholder="Send a Message"
      style={styles.chatInput}
      value={chatInput}
      onChangeText={setChatInput}
      onSubmitEditing={event => sendMessage(event.nativeEvent.text)}/>
    </View>
  )
}

const styles = {
  messageFromOther : {
    backgroundColor : "#E86252",
    marginLeft : 5
  },
  messageFromYou : {
    backgroundColor : "#c6c6c6",
    alignSelf : "flex-end",
    marginRight : 5
  },
  message : {
    padding : 20,
    width : "50%",
    marginVertical : 5,
    borderRadius : 10,
  },
  messageText : {
    color : "#f5f5f5"
  },
  timestamp : {
    fontWeight : "bold",
    marginTop : 10
  },
  chatInput : {
    backgroundColor : "white",
    marginTop : "auto",
    paddingLeft : 10
  },
}

export default Chat;
