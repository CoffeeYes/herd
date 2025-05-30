import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Text, View, TextInput,
         SectionList,
         KeyboardAvoidingView } from 'react-native';
import moment from 'moment';
import { PanGestureHandler, TouchableOpacity  } from 'react-native-gesture-handler'
import Icon from 'react-native-vector-icons/MaterialIcons';

import {
  getMessagesWithContact,
  sendMessageToContact,
  deleteMessages as deleteMessagesFromRealm} from '../realm/chatRealm';
import { parseRealmID } from '../helper';
import { encryptStrings, storeChatHasNewMessages } from '../common';

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

import Header from './Header';
import ChatBubble from './ChatBubble';
import ContactImage from './ContactImage';
import ConfirmationModal from './ConfirmationModal';
import LoadingIndicator from './LoadingIndicator';

const maxCharacterCount = 190;

const Chat = ({ route, navigation }) => {
  const dispatch = useDispatch();
  const chats = useSelector(state => state.chatReducer.chats);
  const customStyle = useSelector(state => state.appStateReducer.styles);
  const chat = chats.find(chat => chat._id == route.params.contactID);

  const messages = useSelector(state => state.chatReducer.messages?.[route.params.contactID] || [])
  const backgroundServiceRunning = useSelector(state => state.appStateReducer.backgroundServiceRunning);

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
  const [scrolling, setScrolling] = useState(false);
  const [momentumScrolling, setMomentumScrolling] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [sectionListHeight, setSectionListHeight] = useState(0);
  const [sectionContentHeight, setSectionContentHeight] = useState(0);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [inputHeight, setInputHeight] = useState(50);
  const ownPublicKey = useSelector(state => state.userReducer.publicKey)
  
  const disableChatInputRef = useRef(false);
  const previousTextValueRef = useRef("");
  const shouldScrollToBottomRef = useRef(false);

  const messageLoadingSize = 5;
  const chatWindowSize = 16;

  const twentyFivePercentHeight = useScreenAdjustedSize(0.25,0.25,"height");
  const contactImageSize = useScreenAdjustedSize(0.12,0.07);

  useEffect(() => {
    (async () => {
      if(messages.length === 0 && chat || (chat?.hasNewMessages && getMessageLength() < messageLoadingSize)) {
        setLoading(true);
        await loadMessages(-messageLoadingSize);
        setLoading(false);
      }
      else {
        const [sentLength,receivedLength] = getMessageLength(true);
        const longest = sentLength > receivedLength ? sentLength : receivedLength;
        setMessageStart(-longest - messageLoadingSize)
        setMessageEnd(-longest)
        //if all messages were previously loaded into state when current chat was previously mounted,
        //disable the ability to load more messages and prevent popup from being shown
        if(chat?.doneLoading) {
          setShowedPopup(true);
          setAllowScrollToLoadMessages(false);
          setEnableGestureHandler(false);
        }
      }
      setInitialLoad(false);

      if(chat?._id) {
        dispatch(updateChat({_id : chat._id, hasNewMessages : false}))
        storeChatHasNewMessages(chat._id, false);
      }
    })()
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

  const firstMessageIDRef = useRef("");

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
      if(newMessages.length > 0) {
        firstMessageIDRef.current = newMessages[0]._id
      }
    }
    return newMessagesToAdd;
  }

  const sendMessage = async message => {
    if(message.trim() === "") {
      return;
    }
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
    const newMessageEncrypted = (await encryptStrings(
      contactInfo.key,
      false,
      [message]
    ))[0];

    //encrypt the passed in message using the users own public key
    const newMessageEncryptedCopy = (await encryptStrings(
      "herdPersonal",
      true,
      [message]
    ))[0];

    //add message to UI
    const messageID = sendMessageToContact(metaData, newMessageEncrypted, newMessageEncryptedCopy);
    const newMessage = {...plainText,_id : messageID};
    const selfEncryptedCopy = {...metaData,_id : messageID, text : newMessageEncryptedCopy};

    //add new chat to chats state in redux store if it isnt in chats state
    if(!chat) {
      const newChat = {
        ...contactInfo,
        lastMessageSentBySelf : true,
        lastText : message,
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

    dispatch(addMessagesToQueue([selfEncryptedCopy]));

    if(!enableGestureHandler) {
      shouldScrollToBottomRef.current = true;
    }
    setMessageStart(messageStart - 1);

    backgroundServiceRunning &&
    ServiceInterface.addMessageToService({...newMessage, text : newMessageEncrypted});
  }

  const deleteMessages = async () => {
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
        firstMessageIDRef.current = "";
      }
    }
    else {
      firstMessageIDRef.current = getFirstMessageID(updatedMessages);
    }

    const deletedReceivedMessages = fullHighlightedMessages.filter(message =>
      message.to.trim() === ownPublicKey.trim()
    )
    .map(message => ({...message,_id : parseRealmID(message)}));

    if(backgroundServiceRunning) {
      await ServiceInterface.removeMessagesFromService(highlightedMessages);
      await ServiceInterface.addDeletedMessagesToService(deletedReceivedMessages);
    }

    setHighlightedMessages([]);
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

  useEffect(() => {
    if(sectionContentHeight <= sectionListHeight) {
      setAllowScrollToLoadMessages(false)
      setEnableGestureHandler(true)
    }
    else {
      !showedPopup && setAllowScrollToLoadMessages(true)
      setEnableGestureHandler(false)
    }
  },[sectionListHeight,sectionContentHeight])

  const handleContentSizeChange = (contentHeight) => {
    setSectionContentHeight(contentHeight);
    // compare IDs of old first message to new first message to determine if messages have been prepended
    // and a scroll to top is necessary.
    const firstMessageID = getFirstMessageID(messages);
    if (messages.length > 0 && firstMessageIDRef.current !== firstMessageID && firstMessageIDRef.current.length > 0){
      scrollToTop(true,false);
    }
    else if(shouldScrollToBottomRef.current) {
      scrollToBottom();
      shouldScrollToBottomRef.current = false;
    }
    
    if(firstMessageID) {
      firstMessageIDRef.current = firstMessageID;
    }
  }

  const handleGesture = event => {
    const overrideLoadInitial = getMessageLength(false,messages) < messageLoadingSize;
    const swipeLargeEnough = event.nativeEvent.translationY > (sectionListHeight * 0.4);
    swipeLargeEnough && !showedPopup && messages.length > 0 &&
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
    messages?.[0]?.data?.length > 0 &&
    scrollRef.current.scrollToLocation({
      animated,
      sectionIndex : 0,
      itemIndex : 0,
      viewOffset : 6,
      viewPosition : 0
    });
  }

  const getFirstMessageID = messages => {
    const firstMessageSectionIndex = messages.length - 1;
    const firstMessageIndex = messages[firstMessageSectionIndex]?.data?.length - 1;
    const firstMessageID = messages[firstMessageSectionIndex]?.data[firstMessageIndex]?._id;
    return firstMessageID;
  }
  
  let scrollRetryCount = 0;
  let sectionOffset = 1
  const scrollToTop = (animated = true, isFailureRetry) => {
    let lastSectionIndex = messages?.length - sectionOffset;
    let lastMessageIndex = messages?.[lastSectionIndex]?.data?.length -1;
    let targetIndexAfterFailure = lastMessageIndex - scrollRetryCount;
    if(targetIndexAfterFailure < 0) {
      sectionOffset += 1;
      lastSectionIndex = messages?.length - sectionOffset;
      let totalPassedMessages = 0;
      for(let i = sectionOffset; i > 1; i--) {
        if(messages?.[messages?.length - i]?.length > 0) {
          totalPassedMessages += messages?.[messages?.length - i].data.length
        }
      }
      const differenceFromPreviousSection = scrollRetryCount - lastMessageIndex - totalPassedMessages;
      targetIndexAfterFailure = messages?.[lastSectionIndex]?.data?.length - 1 - differenceFromPreviousSection;
    }

    const scrollOptions = {
      animated,
      sectionIndex : lastSectionIndex,
      viewPosition : 1,
    }

    if(messages.length > 0 && lastSectionIndex >= 0 && lastMessageIndex >= 0) {
      if(isFailureRetry) {
        scrollRetryCount += 1;
        if (targetIndexAfterFailure >= 0 && scrollRetryCount <= 4) {
          scrollRef.current.scrollToLocation({
            ...scrollOptions,
            itemIndex : targetIndexAfterFailure
          })
        }
        else {
          scrollRetryCount = 0;
          console.log("retrying scrollToTop failed 4 times or hit 0, not attempting more")
        }
      }
      else {
        scrollRetryCount = 0;
        scrollRef.current.scrollToLocation({
          ...scrollOptions,
          itemIndex : lastMessageIndex 
        })
      }
    }
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

  const renderSectionFooter = ({ section: { day } }) => {
    return (
      <Text 
      style={{...styles.messageDay,fontSize : customStyle.messageFontSize}}>
        {day === moment().format("DD/MM") ? "Today" : day}
      </Text>
    )
  }

  const handleSubmit = async text => {
    disableChatInputRef.current = true;
    await sendMessage(text);
  }

  return (
    <>
    <Header
    title={contactInfo.name}
    touchStyle={{backgroundColor : palette.offprimary, paddingVertical : 10}}
    textStyle={{marginLeft : 10, fontSize : customStyle.titleSize}}
    rightButtonIcon={highlightedMessages.length > 0 && "delete"}
    rightButtonOnClick={() => setShowConfirmationModal(true)}
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
      enabled={enableGestureHandler && !loadingMoreMessages}
      onGestureEvent={handleGesture}>
        <View style={{flex : 1}}>
          {((loading || loadingMoreMessages) && !showPopup) &&
          <LoadingIndicator/>}

          <SectionList
          removeClippedSubviews
          contentContainerStyle={{paddingTop : 5, flexGrow : 1, justifyContent : "flex-end"}}
          windowSize={chatWindowSize}
          sections={messages}
          ref={scrollRef}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          scrollEventThrottle={25}
          onScroll={e => setScrollPosition(e.nativeEvent.contentOffset.y)}
          onLayout={e => setSectionListHeight(e.nativeEvent.layout.height)}
          onContentSizeChange={(contentWidth, contentHeight) => handleContentSizeChange(contentHeight)}
          inverted
          onEndReached={() => allowScrollToLoadMessages && (scrolling || momentumScrolling) && handleScroll()}
          onScrollBeginDrag={() => setScrolling(true)}
          onScrollEndDrag={() => setScrolling(false)}
          onScrollToIndexFailed={e => {
            if(e.index > 0) {
              scrollToTop(true,true)
            }
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
          renderSectionFooter={renderSectionFooter}/>
        </View>
      </PanGestureHandler>

      <View style={{...styles.inputControlContainer, ...(scrollPosition > 0 && ({...styles.inputControlBorderTop}))}}>
        <View style={styles.inputContainer}>
          <TextInput
          placeholder="Send a Message"
          returnKeyType='done'
          style={{
            ...styles.chatInput,
            backgroundColor : palette.white,
            fontSize : customStyle?.scaledUIFontSize,
            flex : 1
          }}
          onLayout={e => chatInput.length == 0 && !disableChatInputRef.current && setInputHeight(e.nativeEvent.layout.height)}
          value={chatInput}
          maxLength={maxCharacterCount}
          onChangeText={text => {
            setChatInput(previousText => {
              if(previousText == "" && text.includes(previousTextValueRef.current) && previousTextValueRef.current.length > 1 && text.length > previousTextValueRef.current.length) {
                setCharacterCount(maxCharacterCount)
                return ""  
              }
              else {
                disableChatInputRef.current = false;
                return text
              }
            })
            !disableChatInputRef.current && 
            setCharacterCount(maxCharacterCount - text.length);

            previousTextValueRef.current = text
          }}
          multiline={true}/>
          <Text style={{fontSize : customStyle.scaledUIFontSize, color : palette.grey}}>
            {`${characterCount}`}
          </Text>
        </View>
        <TouchableOpacity
        style={{...styles.sendButton, width : inputHeight, height : inputHeight, borderRadius : inputHeight / 2}}
        onPress={async () => await handleSubmit(chatInput)}>
          <Icon name="send" size={32} color={palette.primary}/>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>

    <ConfirmationModal
    visible={showConfirmationModal}
    titleText="Are you sure you want to delete these messages?"
    confirmText="Delete"
    onConfirm={async () => {
      await deleteMessages();
      setShowConfirmationModal(false);
    }}
    onCancel={() => setShowConfirmationModal(false)}
    />
    </>
  )
}

const styles = {
  chatInput : {
    backgroundColor : palette.white,
    marginTop : "auto",
    paddingLeft : 10,
    borderRadius : 10,
  },
  inputContainer : {
    flexDirection : "row",
    backgroundColor : palette.white,
    flex : 1,
    alignItems : "center",
    borderRadius : 10,
    paddingRight : 10
  },
  sendButton : {
    alignItems : "center",
    justifyContent : "center",
    backgroundColor : palette.white,
    marginLeft : 10
  },
  inputControlContainer : {
    flexDirection : "row",
    padding : 10,
    alignItems : "flex-end",
  },
  inputControlBorderTop : {
    borderTopWidth : 1,
    borderTopColor : "rgba(0,0,0,0.2)"
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
  loadingIndicator : {
    position : "absolute",
    alignSelf : "center",
    marginTop : 20,
    zIndex : 999
  }
}

export default Chat;
