import React, { useState, useEffect, useRef } from 'react';
import { Text, View, ScrollView, TextInput, ActivityIndicator,
         Image, Dimensions, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import Realm from 'realm';

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
    Crypto.loadKeyFromKeystore("herdPersonal").then(key => setOwnPublicKey(key))
    loadMessages();
    setLoading(false);
  },[]);

  const loadMessages = async (key) => {
    var sentMessagesCopy;
    var receivedMessages;
    try {
      const contactsRealm = await Realm.open({
        path : 'contacts',
        schema : [Schemas.ContactSchema]
      })
      const contact = contactsRealm.objectForPrimaryKey("Contact",ObjectId(route.params.contactID));
      setContactInfo({...contact});
      const messageCopyRealm = await Realm.open({
        path : "MessagesCopy",
        schema: [Schemas.MessageSchema],
      });
      sentMessagesCopy = await messageCopyRealm.objects("Message")?.filtered("to = " + "'" + contact.key + "'");
      const messageReceivedRealm = await Realm.open({
        path : "MessagesReceived",
        schema: [Schemas.MessageSchema],
      });
      receivedMessages = messageReceivedRealm.objects("Message")?.filtered("from = " + "'" + contact.key + "'");
    }
    catch(error) {
      console.log("Error opening Realms : " + error)
    }

    var initialReceivedMessages = [];
    if(receivedMessages.length > 0) {
      for(var message in receivedMessages) {
        const decrypted = Crypto.decryptString(
          "herdPersonal",
          Crypto.algorithm.RSA,
          Crypto.blockMode.ECB,
          Crypto.padding.OAEP_SHA256_MGF1Padding,
          receivedMessages[message].text
        )
        initialReceivedMessages.push({...receivedMessages[message],text : decrypted});
      }
    }

    var initialSentMessages = [];
    if(sentMessagesCopy.length > 0) {
      for(var message in sentMessagesCopy) {
        const decrypted = await Crypto.decryptString(
          "herdPersonal",
          Crypto.algorithm.RSA,
          Crypto.blockMode.ECB,
          Crypto.padding.OAEP_SHA256_MGF1Padding,
          sentMessagesCopy[message].text
        )
        initialSentMessages.push({...sentMessagesCopy[message],text : decrypted})
      }
    }
    setMessages([...initialSentMessages,...initialReceivedMessages].sort( (a,b) => a.timestamp > b.timestamp))
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

    var userData = JSON.parse(await AsyncStorage.getItem(route.params.contactID));
    //default userData if there is none
    if(!userData) {
      userData = {
        sent : [],
        received : [],
        sentCopy : []
      }
    }
    //generate new unique uuid for the message
    var id = uuidv4();
    while(userData.sent.find(message => message.id === id) != undefined) {
      id = uuidv4();
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
      timestamp : Date.now(),
      id : id
    }
    userData.sentCopy.push(messageToAddCopy);
    await AsyncStorage.setItem(route.params.contactID,JSON.stringify(userData));
    setInputDisabled(false);
    try {
      const messageCopyRealm = await Realm.open({
        path : "MessagesCopy",
        schema: [Schemas.MessageSchema],
      });
      messageCopyRealm.write(() => {
        // Assign a newly-created instance to the variable.
        messageCopyRealm.create("Message",{
          _id : Realm.BSON.ObjectId(),
          to : contactInfo.key,
          from : ownPublicKey,
          text : newMessageEncryptedCopy,
          timestamp : Date.now(),
        })
      });
      const messageSentRealm = await Realm.open({
        path : "MessagesSent",
        schema: [Schemas.MessageSchema],
      });
      messageSentRealm.write(() => {
        // Assign a newly-created instance to the variable.
        messageSentRealm.create("Message",{
          _id : Realm.BSON.ObjectId(),
          to : contactInfo.key,
          from : ownPublicKey,
          text : newMessageEncrypted,
          timestamp : Date.now(),
        })
      });

    } catch (err) {
      console.error("Failed to open the messageCopyRealm", err.message);
    }
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
