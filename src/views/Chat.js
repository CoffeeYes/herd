import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Text, View, TextInput, ActivityIndicator, 
         Alert, SectionList,
         KeyboardAvoidingView, Keyboard} from 'react-native';
import moment from 'moment';
import { PanGestureHandler, TouchableOpacity  } from 'react-native-gesture-handler'
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  getMessagesWithContact,
  sendMessageToContact,
  deleteMessages as deleteMessagesFromRealm} from '../realm/chatRealm';
import { parseRealmID } from '../realm/helper';

import { useScreenAdjustedSize } from '../helper';

import {
  addChat,
  updateChat,
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

const maxCharacterCount = 190;

const Chat = ({ route, navigation }) => {
  const dispatch = useDispatch();
  const chats = useSelector(state => state.chatReducer.chats);
  const customStyle = useSelector(state => state.chatReducer.styles);
  const chat = chats.find(chat => chat._id == route.params.contactID);

  const messages = useSelector(state => state.chatReducer.messages?.[route.params.contactID] || [])

  const contactInfo = useSelector(state => state.contactReducer.contacts.find(contact => contact._id == route.params.contactID))
  const [loading, setLoading] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [characterCount, setCharacterCount] = useState(maxCharacterCount);
  const [highlightedMessages, setHighlightedMessages] = useState([]);
  const [messageStart, setMessageStart] = useState(-messageLoadingSize);
  const [messageEnd, setMessageEnd] = useState();
  const [loadingMoreMessages, setLoadingMoreMessages] = useState(false);
  const [allowScrollToLoadMessages, setAllowScrollToLoadMessages] = useState(true);
  const [enableGestureHandler, setEnableGestureHandler] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [showedPopup, setShowedPopup] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [chatWindowSize, setChatWindowSize] = useState(1);
  const [scrolling, setScrolling] = useState(false);
  const [momentumScrolling, setMomentumScrolling] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const ownPublicKey = useSelector(state => state.userReducer.publicKey)

  const disableInputChange = useRef(false);

  const messageLoadingSize = 5;

  const twentyFivePercentHeight = useScreenAdjustedSize(0.25,0.25,"height");
  const twentyPercentWidth = useScreenAdjustedSize(0.2,0.2,"width");
  const contentTooSmallHeight = useScreenAdjustedSize(0.825, 0.7, "height");
  const contactImageSize = useScreenAdjustedSize(0.12,0.07);
  const inputHeight = useScreenAdjustedSize(0.075,0.15,"height", 1, 0.7, 1000, 1000);
  const swipeSize = useScreenAdjustedSize(0.25, 0.4, "height");

  useEffect(() => {
    (async () => {
      const existingChat = chat;
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
      setInitialLoad(false);
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
        flattenedMessages = flattenMessages(customMessages);
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

  const flattenMessages = (messages, includeDays = false) => {
    let extractedArray = [];
    if(includeDays) {
      extractedArray = messages.map(section => [...section.data, section.day])
    }
    else {
      extractedArray = messages.map(section => section.data);
    }
    return extractedArray.flat()
  }

  const loadMessages = async (messageStart, messageEnd) => {
    const messagePackage = await getMessagesWithContact(contactInfo.key,messageStart,messageEnd);
    const newMessages = messagePackage.messages;

    //if overrideLoadInitial is used when loading more messages, we need to catch when all new messages are duplicates of the current messages
    //as this means there are no more messages. This is necessary because overrideLoadInitial will always return messages
    // if there are any present in the database.
    const extractedMessageIDs = flattenMessages(messages).map(message => message._id)

    //generate array difference between new and existing messages to see if actual new messages are present
    const newMessagesToAdd = newMessages.filter(messageID => !extractedMessageIDs.includes(messageID)).length > 0;

    const [sentMessageCount,receivedMessageCount] = getMessageLength(true, newMessages);

    const noMoreMessagesToLoad = (receivedMessageCount < messageLoadingSize) && (sentMessageCount < messageLoadingSize)

    if(!newMessagesToAdd || (noMoreMessagesToLoad && !initialLoad)) {
      showNoMoreMessagePopup();
    }
    
    newMessagesToAdd && 
    dispatch(prependMessagesForContact(route.params.contactID,newMessages));
    //if this is the first load, more messages can be returned than expected
    //As such, adjust the message
    //loading size so that the correct messages are loaded on the next load attempt
    if(messageStart == -messageLoadingSize) {
      setMessageStart(messagePackage?.newStart ? messagePackage.newStart - messageLoadingSize : -(2*messageLoadingSize));
      setMessageEnd(messagePackage?.newEnd ? messagePackage.newEnd : -messageLoadingSize);
    }
    return newMessagesToAdd;
  }

  const encryptString = async (string, keyToEncryptWith) => {
    //use key to encrypt when it is passed, otherwise load key from store using alias
    const loadKeyFromStore = !keyToEncryptWith;
    const keyToUse = loadKeyFromStore ? "herdPersonal" : keyToEncryptWith;
    const encryptedString = (await Crypto.encryptStrings(
      keyToUse,
      loadKeyFromStore,
      Crypto.algorithm.RSA,
      Crypto.blockMode.ECB,
      Crypto.padding.OAEP_SHA256_MGF1Padding,
      [string]
    ))[0]
    return encryptedString;
  }

  const sendMessage = async message => {
    if(message.trim() === "") {
      return;
    }
    disableInputChange.current = true;
    setChatInput("");
    setCharacterCount(maxCharacterCount);

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
    if(!chat) {
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

    !enableGestureHandler &&
    scrollToBottom();

    setMessageStart(messageStart - 1);

    await ServiceInterface.isRunning() &&
    ServiceInterface.addMessageToService(selfEncryptedCopy);
    
    disableInputChange.current = false;
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
            deleteMessagesFromRealm(highlightedMessages);

            const fullHighlightedMessages = flattenMessages(messages)
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

            if(updatedMessages.length === 0) {
              let doneLoading = chat?.doneLoading;
              if(!doneLoading) {
                doneLoading = !(await loadMoreMessages(true,messageStart + messageLoadingExtension));
              }
              if(doneLoading) {
                dispatch(deleteChats([contactInfo]));
              }
            }

            const deletedReceivedMessages = highlightedMessages.filter(message =>
              message.to === ownPublicKey
            )
            .map(message => ({...message,_id : parseRealmID(message)}));

            if(await ServiceInterface.isRunning()) {
              await ServiceInterface.removeMessagesFromService(highlightedMessages);
              await ServiceInterface.addDeletedMessagesToService(deletedReceivedMessages);
            }

            setHighlightedMessages([]);
          },
        },
      ]
    );
  }

  const handleScroll = () => {
    if(!showedPopup) {
      const overrideLoadInitial = getMessageLength(false,messages) < messageLoadingSize;
      loadMoreMessages(overrideLoadInitial);
    }
  }

  const loadMoreMessages = async (overrideLoadInitial = false, start = messageStart, end = messageEnd) => {
    if(!loadingMoreMessages) {
      let loadedMoreMessages = false
      setLoadingMoreMessages(true)
      if(overrideLoadInitial) {
        loadedMoreMessages = await loadMessages(start)
      }
      else {
        loadedMoreMessages = await loadMessages(start,end)
      }
      setMessageEnd(start);
      setMessageStart(start - messageLoadingSize);

      setLoadingMoreMessages(false);
      return loadedMoreMessages;
    }
  }

  const handleContentSizeChange = (contentHeight) => {
    //compare old message length against new message length
    //scroll to bottom on initial load and to top when new messages are added
    const messageLength = getMessageLength();
    if(messageLengthRef.current === 0 && messages.length > 0) {
      scrollToBottom(false);
    }
    else if((messageLength - messageLengthRef.current > 1) && messageLength > 0){
      scrollToTop();
    }

    if(contentHeight < contentTooSmallHeight) {
      setAllowScrollToLoadMessages(false)
      setEnableGestureHandler(true)
    }
    else {
      !showedPopup && setAllowScrollToLoadMessages(true)
      setEnableGestureHandler(false)
    }

    messageLengthRef.current = messageLength;
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
  const momentumEndFiredCount = useRef(0);

  const scrollToBottom = (animated = true) => {
    messages.length > 0 &&
    messages?.[0]?.data?.length > 0 &&
    scrollRef.current.scrollToLocation({
      animated : animated,
      sectionIndex : 0,
      itemIndex : 0,
      viewOffset : 6 
    });
  }

  const scrollToTop = (animated = true, optionalTargetIndex) => {
    const lastSectionIndex = messages?.length -1;
    const lastMessageIndex = messages?.[lastSectionIndex]?.data?.length -1;

    messages.length > 0 &&
    lastSectionIndex >= 0 &&
    lastMessageIndex >= 0 &&
    scrollRef.current.scrollToLocation({
      animated : animated,
      sectionIndex : lastSectionIndex,
      itemIndex : optionalTargetIndex ? optionalTargetIndex : lastMessageIndex,
      viewPosition : 1
    })
  }

  const longPressMessage = id => {
    setHighlightedMessages(highlightedMessages => 
      highlightedMessages.includes(id) ? 
      highlightedMessages 
      : 
      [...highlightedMessages,id]
    );
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

  const renderItem = useCallback(({item}) => {
    return (
      <ChatBubble
      text={item.text}
      textFontSize={customStyle.scaledMessageFontSize}
      onLongPress={useCallback(() => longPressMessage(item._id),[])}
      onPress={useCallback(() => shortPressMessage(item._id),[])}
      highlighted={highlightedMessages.includes(item._id)}
      timestamp={moment(item.timestamp).format("HH:mm")}
      messageFrom={item.from === ownPublicKey}
      customStyle={customStyle}
      showCopyButton={highlightedMessages.length === 1 && highlightedMessages.includes(item._id)}
      />
    )
  },[messages, highlightedMessages])

  return (
    <>
    <Header
    title={contactInfo.name}
    touchStyle={{backgroundColor : palette.offprimary, paddingVertical : 10}}
    textStyle={{marginLeft : 10, fontSize : customStyle.titleSize}}
    rightButtonIcon={highlightedMessages.length > 0 && "delete"}
    rightButtonOnClick={() => deleteMessages()}
    allowGoBack
    onTextTouch={() => navigation.navigate("contact", {id : parseRealmID(contactInfo)})}
    preText={
      contactInfo?.image?.length > 0 &&
      <ContactImage
      imageURI={contactInfo.image}
      iconSize={contactImageSize}
      size={contactImageSize}
      containerStyle={styles.imageContainer}
      disableTouch/>
    }/>
    <KeyboardAvoidingView
    style={{flex : 1}}>

      {showPopup &&
      <View style={{...styles.popup, marginTop : twentyFivePercentHeight, width : "80%"}}>
        <Text style={{...styles.popupText, fontSize : customStyle.scaledUIFontSize}}>No more messages to load</Text>
      </View>}

      <PanGestureHandler
      enabled={enableGestureHandler && !loadingMoreMessages && !keyboardVisible}
      onGestureEvent={handleGesture}>
        <View style={{flex : 1}}
        onLayout={e => setChatWindowSize(e.nativeEvent.layout.height)}>
          {((loading || loadingMoreMessages) && !showPopup) &&
          <ActivityIndicator
          size="large"
          color={palette.primary}/>}

          <SectionList
          removeClippedSubviews
          contentContainerStyle={{paddingTop : 5, flexGrow : 1, justifyContent : "flex-end"}}
          windowSize={chatWindowSize}
          sections={messages}
          ref={scrollRef}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          onContentSizeChange={(contentWidth, contentHeight) => handleContentSizeChange(contentHeight)}
          inverted
          onEndReached={() => allowScrollToLoadMessages && (scrolling || momentumScrolling) && handleScroll()}
          onScrollBeginDrag={() => setScrolling(true)}
          onScrollEndDrag={() => setScrolling(false)}
          onScrollToIndexFailed={e => {
            e.index > 0 &&
            scrollToTop(true,e.highestMeasuredFrameIndex);
            console.log("scroll failed", e)
          }}
          onMomentumScrollBegin={() => {
            setMomentumScrolling(true);
          }}
          onMomentumScrollEnd={() => {
            momentumEndFiredCount.current += 1;
            if(momentumEndFiredCount.current > 2) {
              setMomentumScrolling(false);
              momentumEndFiredCount.current = 0;
            }
          }}
          renderSectionFooter={({ section: { day } }) => (
            <Text style={{...styles.messageDay,fontSize : customStyle.messageFontSize}}>
              {day === moment().format("DD/MM") ? "Today" : day}
            </Text>
          )}/>
        </View>
      </PanGestureHandler>

      <View style={{flexDirection : "row", height : inputHeight}}>
        <TextInput
        placeholder="Send a Message"
        returnKeyType='send'
        style={{
          ...styles.chatInput,
          backgroundColor : palette.white,
          fontSize : customStyle?.scaledUIFontSize,
          flex : 1,
          height : inputHeight
        }}
        value={chatInput}
        maxLength={maxCharacterCount}
        onChangeText={text => {
          if(!disableInputChange.current) {
            setChatInput(text)
            setCharacterCount(maxCharacterCount - text.length)
          }
        }}
        multiline={true}/>
        <View style={{
          backgroundColor : palette.white,
          justifyContent : "center"}
        }>
          <Text style={{fontSize : customStyle.scaledUIFontSize}}>
            {`${characterCount} / ${maxCharacterCount}`}
          </Text>
        </View>
        <TouchableOpacity
        style={{...styles.sendButton, width : twentyPercentWidth}}
        onPress={async () => await sendMessage(chatInput)}>
          <Icon name="send" size={32} color={palette.primary}/>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
    </>
  )
}

const styles = {
  chatInput : {
    backgroundColor : palette.white,
    marginTop : "auto",
    paddingLeft : 10,
  },
  imageContainer : {
    borderWidth : 1,
    borderColor : palette.grey,
    marginLeft : 10,
    overflow : "hidden",
    alignSelf : "center",
    alignItems : "center",
    justifyContent : "center",
    marginRight : 20
  },
  messageDay : {
    alignSelf : "center",
  },
  popup : {
    position : "absolute",
    zIndex : 999,
    elevation : 999,
    backgroundColor : palette.white,
    padding : 20,
    alignSelf : "center",
    alignItems : "center",
    borderRadius : 5,
    borderColor : palette.primary,
    borderWidth : 2,
    opacity : 0.8
  },
  popupText : {
    fontWeight : "bold"
  },
  sendButton : {
    alignItems : "center",
    justifyContent : "center",
    backgroundColor : palette.white,
    height : "100%",
    padding : 5 
  }
}

export default Chat;
