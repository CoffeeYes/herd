import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Text, View, TextInput, ActivityIndicator, StatusBar,
         Dimensions, ScrollView, TouchableOpacity, Alert, SectionList,
         KeyboardAvoidingView, Keyboard} from 'react-native';
import moment from 'moment';
import { PanGestureHandler  } from 'react-native-gesture-handler'
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
  addMessagesToQueue,
  deleteChats,
  deleteMessages as deleteMessagesFromState} from '../redux/actions/chatActions';

import { palette } from '../assets/palette';
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
  const [messageEnd, setMessageEnd] = useState();
  const [loadingMoreMessages, setLoadingMoreMessages] = useState(false);
  const [allowScrollToLoadMessages, setAllowScrollToLoadMessages] = useState(true);
  const [enableGestureHandler, setEnableGestureHandler] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [showedPopup, setShowedPopup] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [chatWindowSize, setChatWindowSize] = useState(1);

  const ownPublicKey = useSelector(state => state.userReducer.publicKey)

  const messageLoadingSize = 5;

  useEffect(() => {
    (async () => {
      const existingChat = chats.find(chat => chat._id == contactInfo._id);
      const doneLoading = existingChat?.doneLoading;
      if(messages.length === 0 && existingChat) {
        setLoading(true);
        await loadMessages(-messageLoadingSize);
        setLoading(false);
        scrollToBottom(false);
      }
      else {
        const [sentLength,receivedLength] = getMessageLength(true);
        const longest = sentLength > receivedLength ? sentLength : receivedLength;
        setMessageStart(-longest - messageLoadingSize)
        setMessageEnd(-longest)
        //if all messages were previously loaded into state when current chat was previously mounted,
        //disable the ability to load more messages and prevent popup from being shown
        if(doneLoading) {
          setShowedPopup(true);
          setAllowScrollToLoadMessages(false);
          setEnableGestureHandler(false);
        }
      }
    })()

    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
        setAllowScrollToLoadMessages(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  },[]);

  //calculate actual number of messages by extracting them from sections
  const getMessageLength = (splitBySender = false, customMessages = messages) => {
    let sentMessageLength = 0;
    let receivedMessageLength = 0;
    let flattenedMessages = [];
    if(customMessages?.length > 0) {
      if(customMessages?.[0]?.data) {
        flattenedMessages = customMessages.map(section => section.data).flat(1);
      }
      else if (customMessages?.[0]?._id?.length > 0) {
        flattenedMessages = customMessages
      }
      else {
        throw new Error("Invalid array format passed to function getMessageLength")
      }
    }

    if (splitBySender) {
      flattenedMessages.map(message => {
        message.from === ownPublicKey ?
        sentMessageLength += 1
        :
        receivedMessageLength += 1
      })
      return [sentMessageLength,receivedMessageLength]
    }
    else {
      return flattenedMessages.length
    }
  }

  // track previous length of messages for logic, used throughout other logic
  // because it is already available, not because a ref is necessary
  const messageLengthRef = useRef(0);
  useEffect(() => {
    // wait for loading to be done and messages to be rendered before calling
    // scrollToBottom so that it actually executes
    if(!loading) {
      const messageLength = getMessageLength();
      if(messageLengthRef.current === 0 && messages.length > 0) {
        scrollToBottom(false);
      }
      messageLengthRef.current = messageLength;
    }
  },[messages,loading])

  const loadMessages = async (messageStart, messageEnd) => {
    const messagePackage = await getMessagesWithContact(contactInfo.key,messageStart,messageEnd);
    const newMessages = messagePackage.messages;

    if(newMessages.length === 0) {
      if(messageLengthRef.current === 0) {
        dispatch(deleteChats([contactInfo]))
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
      const extractedMessageIDs = messages.map(section => section.data).flat(1).map(message => message._id)

      //generate array difference between new and existing messages to see if actual new messages are present
      let newMessagesToAdd = newMessages.filter(messageID => !extractedMessageIDs.includes(messageID)).length > 0;

      const [sentMessageCount,receivedMessageCount] = getMessageLength(true, newMessages);

      const noMoreMessagesToLoad = receivedMessageCount < messageLoadingSize && sentMessageCount < messageLoadingSize
      if(!newMessagesToAdd || noMoreMessagesToLoad) {
        showNoMoreMessagePopup();
      }
    }

    dispatch(prependMessagesForContact(route.params.contactID,newMessages));
    //if this is the first load, more messages can be returned than expected
    //As such, adjust the message
    //loading size so that the correct messages are loaded on the next load attempt
    if(messageStart == -messageLoadingSize) {
      setMessageStart(messagePackage?.newStart ? messagePackage.newStart - messageLoadingSize : -(2*messageLoadingSize));
      setMessageEnd(messagePackage?.newEnd ? messagePackage.newEnd : -messageLoadingSize);
      const newLastText = {...newMessages[newMessages.length-1]};
      dispatch(setLastText(contactInfo._id, newLastText));
    }
  }

  const encryptString = async (string, keyToEncryptWith) => {
    //use key to encrypt when it is passed, otherwise load key from store using alias
    const loadKeyFromStore = !keyToEncryptWith;
    const keyToUse = loadKeyFromStore ? "herdPersonal" : keyToEncryptWith;
    const encryptedString = await Crypto.encryptString(
      keyToUse,
      loadKeyFromStore,
      Crypto.algorithm.RSA,
      Crypto.blockMode.ECB,
      Crypto.padding.OAEP_SHA256_MGF1Padding,
      string
    )
    return encryptedString;
  }

  const sendMessage = async message => {
    setChatInput("");
    setCharacterCount(190);
    if(message.trim() === "") {
      return;
    }
    setInputDisabled(true);

    const timestamp = Date.now();

    //create a message object with relevant metadata
    const metaData = {
      to : contactInfo.key,
      from : ownPublicKey,
      timestamp : timestamp
    }

    //plaintext copy of the message to immediatly append to chat state
    const plainText = {
      ...metaData,
      text : message
    }

    //encrypt the message to be sent using the other users public key
    const newMessageEncrypted = await encryptString(message,contactInfo.key);

    //encrypt the passed in message using the users own public key
    const newMessageEncryptedCopy = await encryptString(message);

    //add message to UI
    const messageID = sendMessageToContact(metaData, newMessageEncrypted, newMessageEncryptedCopy);
    const newMessage = {...plainText,_id : messageID};
    const selfEncryptedCopy = {...metaData,_id : messageID, text : newMessageEncryptedCopy};

    //add new chat to chats state in redux store if it isnt in chats state
    if(!chats.find(chat => chat.key === contactInfo.key)) {
      const newChat = {
        _id : contactInfo._id,
        image : contactInfo.image,
        key : contactInfo.key,
        lastMessageSentBySelf : true,
        lastText : message,
        name : contactInfo.name,
        timestamp : timestamp,
        doneLoading : true
      }
      dispatch(addChat(newChat));

      //don't allow loading new messages because this is a brand new chat
      setShowedPopup(true);
      setAllowScrollToLoadMessages(false);
      setEnableGestureHandler(false);
    }
    dispatch(addMessage(contactInfo._id,newMessage));

    dispatch(addMessagesToQueue([{
      ...selfEncryptedCopy,
      fromContactName : "You",
      toContactName : contactInfo.name,
    }]));

    setInputDisabled(false);

    !enableGestureHandler &&
    scrollToBottom();

    setMessageStart(messageStart - 1);

    await ServiceInterface.isRunning() &&
    ServiceInterface.addMessageToService(selfEncryptedCopy);
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

            const fullHighlightedMessages = messages.map(section => section.data).flat(1)
            .filter(message => highlightedMessages.includes(message._id));

            const [sentLength, receivedLength] = getMessageLength(true,fullHighlightedMessages);

            //set new loading index
            const messageLoadingExtension = sentLength > receivedLength ? sentLength : receivedLength;
            setMessageStart(messageStart + messageLoadingExtension);

            dispatch(deleteMessagesFromState(contactInfo._id,highlightedMessages));

            //get remaining messages
            const updatedMessages = messages.map(section => ({
              ...section,
              data : section.data.filter(message => !fullHighlightedMessages.includes(message))
            }))
            .filter(section => section.data.length > 0);

            if(updatedMessages.length > 0) {
              const lastSection = updatedMessages[updatedMessages.length -1];
              const lastMessageIndex = lastSection.data.length -1;
              const lastMessage = lastSection.data[lastMessageIndex];
              dispatch(setLastText(contactInfo._id,lastMessage))
            }
            else if(!chats.find(chat => chat._id === contactInfo._id)?.doneLoading){
              //if all messages were deleted attempt to load more
              await loadMoreMessages(true,messageStart + messageLoadingExtension);
            }
            else {
              //all messages were deleted and there are no more messages to load
              //so remove chat from chats page
              dispatch(deleteChats([contactInfo]))
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
    if(!loadingMoreMessages) {
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
      setEnableGestureHandler(false);
      setAllowScrollToLoadMessages(false);
      dispatch(updateChat({
        _id : contactInfo._id,
        doneLoading : true
      }))
      setShowPopup(true)
      setTimeout(() => {
        setShowPopup(false);
        setShowedPopup(true);
      },1000)
    }
  }

  const scrollRef = useRef();

  const scrollToBottom = (animated = true) => {
    const lastSectionIndex = messages?.length -1;
    const lastMessageIndex = messages?.[lastSectionIndex]?.data?.length -1;

    messages.length > 0 &&
    lastSectionIndex >= 0 &&
    lastMessageIndex >= 0 &&
    scrollRef.current.scrollToLocation({
      animated : animated,
      sectionIndex : lastSectionIndex,
      itemIndex : lastMessageIndex
    });
  }

  const longPressMessage = id => {
    setHighlightedMessages(highlightedMessages => [...highlightedMessages,id]);
  }

  const shortPressMessage = id => {
    setHighlightedMessages(highlightedMessages => {
      if(highlightedMessages.length > 0) {
        return highlightedMessages.includes(id) ?
        highlightedMessages.filter(message => message !== id)
        :
        [...highlightedMessages,id]
      }
      else {
        return [];
      }
    });
  }

  const renderItem = ({item}) => {
    return (
      <ChatBubble
      text={item.text}
      activeOpacity={highlightedMessages.length === 0 && 0.8}
      onLongPress={useCallback(() => longPressMessage(item._id),[])}
      onPress={useCallback(() => shortPressMessage(item._id),[])}
      highlighted={highlightedMessages.includes(item._id)}
      timestamp={moment(item.timestamp).format("HH:mm")}
      messageFrom={item.from === ownPublicKey}
      customStyle={customStyle}
      />
    )
  }

  const renderItemCallback = useCallback( ({item}) => {
    return renderItem({item})
  },[messages,highlightedMessages])

  const getItemLayout = (data, index) => {
    //multiply by 1.1 for each point increase in fontsize
    const fontSizeFactor = (1 + ((customStyle.messageFontSize - 14)  * 0.1))
    // min height at 14 fontsize ~= 80, max ~= 150, (80 + 150) / 2 = 115
    const estimatedMessageHeight = 115 * fontSizeFactor;
    return {
      length : estimatedMessageHeight,
      offset : estimatedMessageHeight * index,
      index
    }
  }

  return (
    <>
    <Header
    title={contactInfo.name}
    touchStyle={{backgroundColor : palette.offprimary}}
    textStyle={{marginLeft : 10, fontSize : customStyle.titleSize}}
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
    <KeyboardAvoidingView
    onLayout={e => setChatWindowSize(e.nativeEvent.layout.height)}
    style={{flex : 1}}>

      {showPopup &&
      <View style={styles.popup}>
        <Text style={{...styles.popupText, fontSize : customStyle.uiFontSize}}>No more messages to load</Text>
      </View>}

      <PanGestureHandler
      enabled={enableGestureHandler && !loadingMoreMessages && !keyboardVisible}
      onGestureEvent={handleGesture}>
        <View style={{flex : 1}}>
          {((loading || loadingMoreMessages) && !showPopup) &&
          <ActivityIndicator
          size="large"
          color={palette.primary}/>}

          <SectionList
          removeClippedSubviews
          contentContainerStyle={{paddingBottom : 5}}
          windowSize={chatWindowSize}
          sections={messages}
          ref={scrollRef}
          onScroll={ e => (allowScrollToLoadMessages && e.nativeEvent.contentOffset.y === 0) && handleScroll()}
          keyExtractor={item => item._id}
          renderItem={renderItemCallback}
          onContentSizeChange={handleContentSizeChange}
          getItemLayout={getItemLayout}
          renderSectionHeader={({ section: { day } }) => (
            <Text style={{...styles.messageDay,fontSize : customStyle.messageFontSize}}>
              {day === moment().format("DD/MM") ? "Today" : day}
            </Text>
          )}/>
        </View>
      </PanGestureHandler>

      <View style={{flexDirection : "row"}}>
        <TextInput
        placeholder="Send a Message"
        style={{
          ...styles.chatInput,
          backgroundColor : inputDisabled ? palette.mediumgrey : palette.white,
          fontSize : customStyle?.uiFontSize,
          flex : 1
        }}
        value={chatInput}
        editable={!inputDisabled}
        maxLength={190}
        onChangeText={text => {
          setChatInput(text)
          setCharacterCount(190 - text.length)
        }}
        multiline={true}
        blurOnSubmit={true}
        onSubmitEditing={event => sendMessage(event.nativeEvent.text.trim())}/>
        <View style={{
          backgroundColor : inputDisabled ? palette.mediumgrey : palette.white,
          justifyContent : "center"}
        }>
          <Text style={{fontSize : customStyle.uiFontSize}}>
            {`${characterCount} / 190`}
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
    </>
  )
}

const styles = {
  chatInput : {
    backgroundColor : palette.white,
    marginTop : "auto",
    paddingLeft : 10
  },
  imageContainer : {
    borderWidth : 1,
    borderColor : palette.grey,
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
    alignSelf : "center",
  },
  popup : {
    position : "absolute",
    marginLeft : Dimensions.get("window").width * 0.1,
    marginTop : Dimensions.get("window").height * 0.1,
    width : Dimensions.get("window").width * 0.8,
    zIndex : 999,
    elevation : 999,
    backgroundColor : palette.white,
    padding : 20,
    alignItems : "center",
    borderRadius : 5,
    borderColor : palette.primary,
    borderWidth : 2,
    opacity : 0.8
  },
  popupText : {
    fontWeight : "bold"
  }
}

export default Chat;
