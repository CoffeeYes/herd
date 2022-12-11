import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Text, View, TextInput, ActivityIndicator, StatusBar,
         Dimensions, ScrollView, TouchableOpacity, Alert, SectionList } from 'react-native';
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

import {
  addChat,
  updateChat,
  setLastText,
  prependMessagesForContact,
  addMessage,
  addMessageToQueue,
  removeMessagesFromQueue,
  deleteChat,
  deleteMessages as deleteMessagesFromState} from '../redux/actions/chatActions';

import ServiceInterface from '../nativeWrapper/ServiceInterface';
import Crypto from '../nativeWrapper/Crypto';

import Header from './Header';
import ChatBubble from './ChatBubble';
import ContactImage from './ContactImage';

const swipeSize = Dimensions.get('window').height * 0.25;

const Chat = ({ route, navigation }) => {
  const dispatch = useDispatch();
  const chats = useSelector(state => state.chatReducer.chats);
  const customStyle = useSelector(state => state.chatReducer.styles);
  const messages = useSelector(state => state.chatReducer.messages?.[route.params.contactID] || []);
  const contactInfo = useSelector(state => state.contactReducer.contacts.find(contact => contact._id == route.params.contactID))
  const [loading, setLoading] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [characterCount, setCharacterCount] = useState(190);
  const [highlightedMessages, setHighlightedMessages] = useState([]);
  const [inputDisabled, setInputDisabled] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [messageStart, setMessageStart] = useState(-messageLoadingSize);
  const [messageEnd, setMessageEnd] = useState(undefined);
  const [loadingMoreMessages, setLoadingMoreMessages] = useState(false);
  const [allowScrollToLoadMessages, setAllowScrollToLoadMessages] = useState(true);
  const [enableGestureHandler, setEnableGestureHandler] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [showedPopup, setShowedPopup] = useState(false);

  const ownPublicKey = useSelector(state => state.userReducer.publicKey)

  const messageLoadingSize = 5;

  useEffect(() => {
    (async () => {
      if(messages.length === 0) {
        setLoading(true);
        await loadMessages(-messageLoadingSize);
      }
      else {
        const messageLengths = getMessageLength(true);
        const longest = messageLengths[0] > messageLengths[1] ? messageLengths[0] : messageLengths[1];
        setMessageStart(-longest - messageLoadingSize)
        setMessageEnd(-longest)
        scrollToBottom(false);
        //if all messages were previously loaded into state when current chat was previously mounted,
        //disable the ability to load more messages and prevent popup from being shown
        if(chats.find(chat => chat._id === contactInfo._id)?.doneLoading) {
          setShowedPopup(true);
          setAllowScrollToLoadMessages(false);
          setEnableGestureHandler(false);
        }
      }
      setLoading(false);
    })()
  },[]);

  //calculate actual number of messages by extracting them from sections
  const getMessageLength = (splitBySender = false, customMessages = messages) => {
    let sentMessageLength = 0;
    let receivedMessageLength = 0;
    let totalMessageLength = 0;
    splitBySender ?
    customMessages.map(section => section.data.map(message => {
        message.from === ownPublicKey ?
        sentMessageLength += 1
        :
        receivedMessageLength += 1
      })
    )
    :
    customMessages.map(section => totalMessageLength += section.data.length)
    return splitBySender ? [sentMessageLength,receivedMessageLength] : totalMessageLength;
  }

  //use a ref for messages length because when calling loadMoreMessages
  //during deleteMessages process messages state is outdated, leading to wrong
  //length being used for decision making in deleting chat
  const messageLengthRef = useRef();
  useEffect(() => {
    messageLengthRef.current = getMessageLength();
  },[messages])

  const loadMessages = async (messageStart, messageEnd) => {
    const messagePackage = await getMessagesWithContact(contactInfo.key,messageStart,messageEnd)
    const newMessages = messagePackage.messages

    if(newMessages.length === 0) {
      if(messageLengthRef.current === 0) {
        dispatch(deleteChat(contactInfo))
      }
      else {
        //show popup that no more messages can be loaded, but only do so when
        //there are already messages in the chat to prevent the popup from showing
        //when a new chat is started
        showNoMoreMessagePopup();
        return;
      }
      setAllowScrollToLoadMessages(false);
    }
    else {
      //if overrideLoadInitial is used when loading more messages, we need to catch when all new messages are duplicates of the current messages
      //as this means there are no more messages. This is necessary because overrideLoadInitial will always return messages
      // if there are any present in the database.
      const extractedMessages = messages.map(section => section.data)[0];
      if(JSON.stringify(extractedMessages) == JSON.stringify(newMessages)) {
        showNoMoreMessagePopup();
        return;
      }
    }

    dispatch(prependMessagesForContact(route.params.contactID,newMessages));
    //if this is the first load, more messages can be returned that expected
    //in order to ensure correct message order. As such, adjust the message
    //loading size so that the correct messages are loaded on the next load attempt
    if(messageStart == -messageLoadingSize) {
      setMessageStart(messagePackage?.newStart ? messagePackage.newStart - messageLoadingSize : -(2*messageLoadingSize));
      setMessageEnd(messagePackage?.newEnd ? messagePackage.newEnd : -messageLoadingSize);
      const newLastText = {...newMessages[newMessages.length-1]};
      dispatch(setLastText(contactInfo._id, newLastText));
    }
  }

  const sendMessage = async message => {
    if(message.trim() === "") return;
    setInputDisabled(true);

    const timestamp = Date.now();

    //plaintext copy of the message to immediatly append to chat state
    const plainText = {
      to : contactInfo.key,
      from : ownPublicKey,
      text : message,
      timestamp : timestamp
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
      timestamp : timestamp
    }

    //add message to UI
    let messageID = sendMessageToContact(metaData, newMessageEncrypted, newMessageEncryptedCopy);
    const newMessage = {...plainText,_id : messageID};

    //add new chat to chats state in redux store if it isnt in chats state
    if(chats.find(chat => chat.key === contactInfo.key) === undefined) {
      const newChat = {
        _id : contactInfo._id,
        image : contactInfo.image,
        key : contactInfo.key,
        lastMessageSentBySelf : true,
        lastText : message,
        name : contactInfo.name,
        timestamp : timestamp
      }
      dispatch(addChat(newChat));
    }
    dispatch(addMessage(contactInfo._id,newMessage));

    dispatch(addMessageToQueue({
      _id : messageID,
      fromContactName : "You",
      toContactName : contactInfo.name,
      to : contactInfo.key,
      from : ownPublicKey,
      timestamp : timestamp,
      text : newMessageEncryptedCopy
    }));

    setChatInput("");
    setCharacterCount(190);
    setInputDisabled(false);

    scrollToBottom();

    setMessageStart(messageStart - 1)

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
            deleteMessagesFromRealm(highlightedMessages.map(message => parseRealmID(message)));

            let sentLength = 0;
            let receivedLength = 0;
            for(let message of highlightedMessages) {
              if(message.from === ownPublicKey) {
                sentLength += 1;
              }
              else {
                receivedLength += 1;
              }
            }

            //set new loading index
            const messageLoadingExtension = sentLength > receivedLength ? sentLength : receivedLength;
            setMessageStart(messageStart + messageLoadingExtension);

            dispatch(deleteMessagesFromState(contactInfo._id,highlightedMessages));
            dispatch(removeMessagesFromQueue(highlightedMessages))

            //get remaining messages
            const updatedMessages = messages.map(section => ({
              ...section,
              data : section.data.filter(message => highlightedMessages.indexOf(message) === -1)
            }))
            .filter(section => section.data.length > 0);

            if(updatedMessages.length > 0) {
              const lastMessage = updatedMessages[updatedMessages.length -1].data[updatedMessages[updatedMessages.length -1].data.length -1]
              dispatch(setLastText(contactInfo._id,lastMessage))
            }
            else {
              //if all messages were deleted attempt to load more
              await loadMoreMessages(true,messageStart + messageLoadingExtension);
            }

            const messagesToDelete = highlightedMessages.map(message => ({...message,_id : parseRealmID(message)}));

            const deletedReceivedMessages = highlightedMessages.filter(message =>
              message.to === ownPublicKey
            )
            .map(message => ({...message,_id : parseRealmID(message)}));

            if(await ServiceInterface.isRunning()) {
              await ServiceInterface.removeMessagesFromService(highlightedMessages);
              await ServiceInterface.addDeletedMessagesToService(deletedReceivedMessages);
            }

            setHighlightedMessages([]);
            setInputDisabled(false);
          },
        },
      ]
    );
  }

  const handleScroll = async event => {
    if(!showedPopup) {
      const overrideLoadInitial = getMessageLength(false,messages) < messageLoadingSize;
      loadMoreMessages(overrideLoadInitial);
    }
  }

  const loadMoreMessages = async (overrideLoadInitial = false, start = messageStart, end = messageEnd) => {
    setLoadingMoreMessages(true)
    if(overrideLoadInitial) {
      await loadMessages(start)
    }
    else {
      await loadMessages(start,end)
    }
    setMessageEnd(start);
    setMessageStart(start - messageLoadingSize);

    setLoadingMoreMessages(false);

    messageLengthRef.current > 0 &&
    scrollRef.current.scrollToLocation({
      animated : true,
      sectionIndex : 0,
      itemIndex : 0,
      viewOffset : -20
    })
  }

  const handleContentSizeChange = (contentWidth, contentHeight) => {
    let windowHeight = Dimensions.get('window').height;
    if(contentHeight < windowHeight * 0.8 ) {
      setAllowScrollToLoadMessages(false)
      setEnableGestureHandler(true)
    }
    else {
      !showedPopup && setAllowScrollToLoadMessages(true)
      setEnableGestureHandler(false)
    }
  }

  const handleGesture = event => {
    const overrideLoadInitial = getMessageLength(false,messages) < messageLoadingSize;
    const allow = event.nativeEvent.translationY > swipeSize && enableGestureHandler;
    allow && !showedPopup && messages.length > 0 &&
    loadMoreMessages(overrideLoadInitial);
  }

  const showNoMoreMessagePopup = () => {
    if(!showedPopup) {
      setShowPopup(true)
      setTimeout(() => {
        setShowPopup(false);
      },1000)
      setShowedPopup(true);
      setEnableGestureHandler(false);
      setAllowScrollToLoadMessages(false);
      dispatch(updateChat({
        _id : contactInfo._id,
        doneLoading : true
      }))
    }
  }

  const scrollRef = useRef();

  const scrollToBottom = (animated = true) => {
    messages.length > 0 &&
    messages[messages.length -1].data.length -1 > 0 &&
    scrollRef.current.scrollToLocation({
      animated : animated,
      sectionIndex : messages.length -1,
      itemIndex : messages[messages.length -1].data.length -1
    });
  }

  const longPressMessage = item => {
    setHighlightedMessages([...highlightedMessages,item]);
  }

  const shortPressMessage = item => {
    if(highlightedMessages.length > 0) {
      setHighlightedMessages(
        highlightedMessages.indexOf(item) == -1 ?
        [...highlightedMessages,item]
        :
        highlightedMessages.filter(message => message !== item)
      );
    }
  }

  const renderItem = ({item}) => {
    return (
      <ChatBubble
      text={item.text}
      onLongPress={() => longPressMessage(item)}
      onPress={() => shortPressMessage(item)}
      highlighted={highlightedMessages.indexOf(item) !== -1}
      timestamp={moment(item.timestamp).format("HH:mm")}
      messageFrom={item.from === ownPublicKey}
      customStyle={customStyle}
      />
    )
  }

  return (
    <>
    <Header
    title={contactInfo.name}
    touchStyle={{backgroundColor : "#f46758"}}
    textStyle={{marginLeft : 10}}
    rightButtonIcon={highlightedMessages.length > 0 && "delete"}
    rightButtonOnClick={() => deleteMessages()}
    allowGoBack
    onTextTouch={() => navigation.navigate("contact", {id : parseRealmID(contactInfo)})}
    preText={
      contactInfo?.image?.length > 0 &&
      <View style={styles.imageContainer}>
        <ContactImage
        imageURI={contactInfo.image}
        iconSize={24}
        imageWidth={Dimensions.get("window").width * imageValues.smallFactor}
        imageHeight={Dimensions.get("window").height * imageValues.smallFactor}/>
      </View>
    }/>
    <View style={{flex : 1}}>

      {showPopup &&
      <View style={styles.popup}>
        <Text style={styles.popupText}>No More messages to load</Text>
      </View>}

      {loading ?
      <ActivityIndicator
      size="large"
      color="#e05e3f"/>
      :
      <PanGestureHandler
      enabled={enableGestureHandler}
      onGestureEvent={handleGesture}>
        <View style={{flex : 1}}>
          <ActivityIndicator
          size="large"
          color="#e05e3f"
          animating={loadingMoreMessages}/>

          <SectionList
          sections={messages}
          ref={scrollRef}
          onScroll={(e) => allowScrollToLoadMessages && e.nativeEvent.contentOffset.y === 0 && handleScroll()}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          onContentSizeChange={handleContentSizeChange}
          getItemLayout={(data, index) => ({length : 80, offset : 80 * index, index})}
          renderSectionHeader={({ section: { day } }) => (
            <Text style={styles.messageDay}>{day === moment().format("DD/MM") ? "Today" : day}</Text>
          )}/>
        </View>
      </PanGestureHandler>}

      <View style={{flexDirection : "row"}}>
        <TextInput
        placeholder="Send a Message"
        style={{
          ...styles.chatInput,
          backgroundColor : inputDisabled ? "#c6c6c6" : "white",
          fontSize : customStyle?.fontSize,
          flex : 1
        }}
        value={chatInput}
        editable={!inputDisabled}
        onChangeText={text => {
          const cutText = text.slice(0,190);
          setChatInput(cutText)
          setCharacterCount(190 - cutText.length)
        }}
        multiline={true}
        blurOnSubmit={true}
        onSubmitEditing={event => sendMessage(event.nativeEvent.text)}/>
        <View style={{backgroundColor : "white", justifyContent : "center"}}>
          <Text style={{fontSize : 12}}>
            {`${characterCount} / 190`}
          </Text>
        </View>
      </View>
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
