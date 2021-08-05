import React, { useState, useEffect, useRef } from 'react';
import { Text, View, ScrollView, TextInput, ActivityIndicator,
         Image, Dimensions, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import Realm from 'realm';
import { getMessagesWithContact, sendMessageToContact } from '../realm/chatRealm';
import { getContactById } from '../realm/contactRealm'

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

  const { ObjectId } = Realm.BSON

  useEffect(() => {
    (async () => {
      Crypto.loadKeyFromKeystore("herdPersonal").then(key => setOwnPublicKey(key))
      await loadMessages();
      await loadStyles();
      setLoading(false);
    })()
  },[]);

  const loadMessages = async (key) => {
    var sentMessagesCopy;
    var receivedMessages;
    const contact = getContactById(ObjectId(route.params.contactID))
    setContactInfo({...contact});
    setMessages(await getMessagesWithContact(contact.key))
  }

  const loadStyles = async () => {
    const style = JSON.parse(await AsyncStorage.getItem("styles"));
    setCustomStyle(style)
  }

  const sendMessage = async message => {
    setInputDisabled(true);
    //plaintext copy of the message to immediatly append to chat state
    const plainText = {
      to : contactInfo.key,
      from : ownPublicKey,
      text : message,
      timestamp : Date.now(),
      id : id
    }

    setMessages([...messages,plainText])
    setChatInput("");
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
      id : id,
      timestamp : Date.now()
    }
    sendMessageToContact(metaData, newMessageEncrypted, newMessageEncryptedCopy);
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
            var userData = JSON.parse(await AsyncStorage.getItem(route.params.contactID));
            var sentMessages = userData.sent;
            var sentMessagesCopy = userData.sentCopy;
            sentMessagesCopy = sentMessagesCopy.filter(message => highlightedMessages.indexOf(message.id) === -1 );
            sentMessages = sentMessages.filter(message => highlightedMessages.indexOf(message.id) === -1 );
            setMessages(messages.filter(message => highlightedMessages.indexOf(message.id) === -1))

            userData.sent = sentMessages;
            userData.sentCopy = sentMessagesCopy;
            await AsyncStorage.setItem(route.params.contactID,JSON.stringify(userData));
            setHighlightedMessages([]);
          },
        },
      ]
    );
  }

  const scrollRef = useRef();

  return (
    <>
    <Header
    title={contactInfo?.name}
    touchStyle={{backgroundColor : "#f46758"}}
    textStyle={{marginLeft : 10}}
    rightButtonIcon={highlightedMessages.length > 0 && "delete"}
    rightButtonOnClick={deleteMessages}
    allowGoBack
    onTextTouch={() => navigation.navigate("contact", {
      id : contactInfo._id[1]
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
          identifier={message.id}
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
      editable={!inputDisabled}
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
