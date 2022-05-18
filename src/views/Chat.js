import React, { useState, useEffect, useRef } from 'react';
import { Text, View, TextInput, ActivityIndicator, StatusBar,
         Image, Dimensions, ScrollView, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import {PanGestureHandler  } from 'react-native-gesture-handler'
import {
  getMessagesWithContact,
  sendMessageToContact,
  deleteMessages as deleteMessagesFromRealm} from '../realm/chatRealm';
import { getContactById } from '../realm/contactRealm';
import { parseRealmID } from '../realm/helper';
import { imageValues } from '../assets/palette';
import ServiceInterface from '../nativeWrapper/ServiceInterface';

import Header from './Header';
import ChatBubble from './ChatBubble';

import Crypto from '../nativeWrapper/Crypto';
const swipeSize = Dimensions.get('window').height * 0.25;

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
  const [messageStart, setMessageStart] = useState(-5);
  const [loadingMoreMessages, setLoadingMoreMessages] = useState(false);
  const [allowScrollToLoadMessages, setAllowScrollToLoadMessages] = useState(true);
  const [enableGestureHandler, setEnableGestureHandler] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [showedPopup, setShowedPopup] = useState(false);

  const messageLoadingSize = 5;

  useEffect(() => {
    (async () => {
      setOwnPublicKey(await Crypto.loadKeyFromKeystore("herdPersonal"))
      await loadMessages(-messageLoadingSize);
      await loadStyles();
      setLoading(false);
    })()
  },[]);

  const loadMessages = async (messageStart, messageEnd) => {
    const contact = getContactById(route.params.contactID);
    setContactInfo(contact);
    var newMessages = await getMessagesWithContact(contact.key,messageStart,messageEnd);
    if(newMessages.length === 0 && messages.length != 0) {
      setAllowScrollToLoadMessages(false);
      showNoMoreMessagePopup();
      return;
    }
    const allMessages = [...messages,...newMessages].sort((a,b) => a.timestamp > b.timestamp)
    setMessageDays(calculateMessageDays(allMessages));
    setMessages(allMessages);
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
    scrollRef.current.scrollToEnd({animated : true});

    await ServiceInterface.isRunning() &&
    ServiceInterface.addMessageToService({...metaData,text : newMessageEncrypted,_id : messageID});
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
            const updatedMessages = [...messages].filter(message => highlightedMessages.indexOf(parseRealmID(message)) === -1);
            const messagesToDelete = [...messages].filter(message => highlightedMessages.indexOf(parseRealmID(message)) !== -10)
            .map(message => ({...message,_id : parseRealmID(message)}))

            const deletedReceivedMessages = [...highlightedMessages].filter(message => message.to === ownPublicKey)
            .map(message => ({...message,_id : parseRealmID(message)}));

            if(await ServiceInterface.isRunning()) {
              await ServiceInterface.removeMessagesFromService(messagesToDelete);
              await ServiceInterface.addDeletedMessagesToService(deletedReceivedMessages);
            }

            setMessageDays(calculateMessageDays(updatedMessages));
            setMessages(updatedMessages);
            setHighlightedMessages([]);
            setInputDisabled(false);
          },
        },
      ]
    );
  }

  const handleScroll = async event => {
    let pos = event.nativeEvent.contentOffset.y
    if(pos === 0 && !showedPopup) {
      loadMoreMessages();
    }
  }

  const loadMoreMessages = async () => {
    setLoadingMoreMessages(true)
    //add 1 to each end of the messages being loaded to prevent "edge" messages from being loaded twice
    await loadMessages(messageStart - (messageLoadingSize + 1), messageStart);
    setMessageStart(messageStart - (messageLoadingSize + 1));

    setLoadingMoreMessages(false);
    scrollRef.current.scrollTo({x : 0, y : 20, animated : true})
  }

  const handleContentSizeChange = (contentWidth, contentHeight) => {
    let windowHeight = Dimensions.get('window').height;
    if(contentHeight < windowHeight * 0.8 ) {
      setAllowScrollToLoadMessages(false)
      setEnableGestureHandler(true)
    }
    else {
      setAllowScrollToLoadMessages(true)
      setEnableGestureHandler(false)
    }
  }

  const handleGesture = event => {
    const allow = event.nativeEvent.translationY > swipeSize && enableGestureHandler;
    if(allow) {
      if(messages.length >= messageLoadingSize) {
        setEnableGestureHandler(false);
        loadMoreMessages();
      }
      else if (!showedPopup) {
        showNoMoreMessagePopup();
      }
    }
  }

  const showNoMoreMessagePopup = () => {
    if(!showedPopup) {

    }
    setShowPopup(true)
    setTimeout(() => {
      setShowPopup(false);
    },1000)
    setShowedPopup(true);
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

      {showPopup &&
      <View style={styles.popup}>
        <Text style={styles.popupText}>No More messages to load</Text>
      </View>}

      {loading ?
      <ActivityIndicator size="large" color="#e05e3f"/>
      :
      <PanGestureHandler
      enabled={enableGestureHandler}
      onGestureEvent={handleGesture}>
        <ScrollView
        contentContainerStyle={styles.messageContainer}
        onScroll={allowScrollToLoadMessages && handleScroll}
        ref={scrollRef}
        onContentSizeChange={handleContentSizeChange}
        onLayout={() => scrollRef.current.scrollToEnd({animated : true})}>

          {loadingMoreMessages &&
          <ActivityIndicator size="large" color="#e05e3f"/>}

          {messageDays.map((day,index) =>
            <View key={index}>
              <Text style={styles.messageDay}>{day === moment().format("DD/MM") ? "Today" : day}</Text>
              {messages.map(message => moment(message.timestamp).format("DD/MM") === day &&
                <ChatBubble
                text={message.text}
                timestamp={moment(message.timestamp).format("HH:mm")}
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
        </ScrollView>
      </PanGestureHandler>}

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
    width : Dimensions.get("window").width * imageValues.smallFactor,
    height : Dimensions.get("window").width * imageValues.smallFactor,
    marginLeft : 10,
    borderRadius : Dimensions.get("window").width * (imageValues.smallFactor/2),
    overflow : "hidden",
    alignSelf : "center",
    alignItems : "center",
    justifyContent : "center",
    marginRight : 20
  },
  image : {
    width : Dimensions.get("window").width * imageValues.smallFactor,
    height : Dimensions.get("window").width * imageValues.smallFactor,
  },
  messageDay : {
    alignSelf : "center"
  },
  popup : {
    position : "absolute",
    marginLeft : Dimensions.get("window").width * 0.1,
    marginTop : Dimensions.get("window").height * 0.1,
    width : Dimensions.get("window").width * 0.8,
    zIndex : 999,
    elevation : 999,
    backgroundColor : "white",
    padding : 20,
    alignItems : "center",
    borderRadius : 5,
    borderColor : "#E86252",
    borderWidth : 2,
    opacity : 0.8
  },
  popupText : {
    fontWeight : "bold"
  }
}

export default Chat;
