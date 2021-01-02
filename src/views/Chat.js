import React, { useState, useEffect } from 'react';
import { Text, View, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';

import Crypto from '../nativeWrapper/Crypto';

const Chat = ({ route, navigation }) => {
  const [messages,setMessages] = useState([]);
  const [yourMessages, setYourMessages] = useState([]);
  const [otherMessages, setOtherMessages] = useState([]);
  const [contactInfo, setContactInfo] = useState({});
  const [ownPublicKey, setOwnPublicKey] = useState("");
  const [loading, setLoading] = useState(true);

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
    var allMessages = JSON.parse(await AsyncStorage.getItem(route.params.username));

    if(allMessages) {
      //decrypt all message text payloads (sent and received) using private key
      for(var message in allMessages) {
        allMessages[message].text = await Crypto.decryptString(
          "herdPersonal",
          Crypto.algorithm.RSA,
          Crypto.blockMode.ECB,
          Crypto.padding.OAEP_SHA256_MGF1Padding,
          allMessages[message].text
        )
      }
      setMessages(allMessages.sort( (a,b) => a.timestamp < b.timestamp))
    }
  }

  const sendMessage = async message => {

    //encrypt the passed in message using the users own public key
    const newMessageEncrypted = await Crypto.encryptString(
      "herdPersonal",
      Crypto.algorithm.RSA,
      Crypto.blockMode.ECB,
      Crypto.padding.OAEP_SHA256_MGF1Padding,
      message
    )
    //create a message object with relevant metadata
    const messageToAdd = {
      to : contactInfo.key,
      from : ownPublicKey,
      text : newMessageEncrypted,
      timestamp : Date.now()
    }

    //load the existing messages with this user and append our new message
    var storedMessages = JSON.parse(await AsyncStorage.getItem(route.params.username));
    if(!storedMessages) {
      storedMessages = []
    }
    //store the new message array
    await AsyncStorage.setItem(
      route.params.username,
      JSON.stringify([...storedMessages,messageToAdd])
    )
  }

  return (
    <View>
      <View style={{backgroundColor : "#e05e3f",paddingVertical : 15,paddingLeft : 10}}>
        <Text style={{color : "white",fontSize : 18}}>{route.params.username}</Text>
      </View>
      {loading && <ActivityIndicator size="large" color="#e05e3f"/>}
      <ScrollView contentContainerStyle={styles.messageContainer}>
        {messages.map( (message,index) =>
          <View
          style={message.from === ownPublicKey ?
            {...styles.message,...styles.messageFromYou}
            :
            {...styles.message,...styles.messageFromOther}}
          key={index}>
            <Text style={styles.messageText}>{message.text}</Text>
            <Text style={styles.timestamp}>{moment(message.timestamp).format("HH:SS - DD.MM")}</Text>
          </View>
        )}
      </ScrollView>

      <TextInput
      placeholder="Send a Message"
      style={styles.chatInput}
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
    marginTop : 10,
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
  messageContainer : {
    height : "100%"
  }
}

export default Chat;
