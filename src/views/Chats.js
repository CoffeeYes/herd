import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ScrollView } from 'react-native';
import Header from './Header';
import ListItem from './ListItem';
import { deleteChats as deleteChatsFromRealm } from '../realm/chatRealm';

import { deleteChats as deleteChatsFromState } from '../redux/actions/chatActions';

import { palette } from '../assets/palette';

import { timestampToText, toHsv } from '../helper';
import ConfirmationModal from './ConfirmationModal';

const Chats = ({ navigation }) => {
  const dispatch = useDispatch();

  const chats = useSelector(state => state.chatReducer.chats);
  const customStyle = useSelector(state => state.chatReducer.styles);
  const [highlightedChats, setHighlightedChats ] = useState([]);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  const canStartNewChat = useSelector(state => state.contactReducer.contacts)
  .filter(contact => chats.find(chat => chat._id === contact._id) === undefined)
  .length > 0;

  const checkStyleReadable = style => {
      const {s,v} = toHsv(style);
      if(s < 0.1 && v > 0.95) {
        return palette.grey
      }
      else {
        return style
      }
  }

  const handleLongPress = id => {
    if(!highlightedChats.includes(id)) {
      setHighlightedChats([...highlightedChats,id]);
    }
  }

  const handlePress = id => {
    if(highlightedChats.length > 0) {
      if(!highlightedChats.includes(id)) {
        setHighlightedChats([...highlightedChats,id]);
      }
      else {
        setHighlightedChats(highlightedChats.filter(highlightedChat => highlightedChat !== id));
      }
    }
    else {
      navigation.navigate("chat", {contactID : id})
    }
  }

  const getRightIcon = () => {
    if (highlightedChats.length > 0) {
      return "delete"
    }
    else if (canStartNewChat) {
      return "add";
    }
  }

  const displayedSentTextColor = checkStyleReadable(customStyle.sentTextColor);
  const displayedReceivedTextColor = checkStyleReadable(customStyle.receivedTextColor);

  return (
    <>
      <Header
      title="Chats"
      rightButtonIcon={getRightIcon()}
      rightButtonOnClick={() => {
        highlightedChats.length > 0 ?
        setShowConfirmationModal(true)
        :
        navigation.navigate("newChat",{type : "newChat", disableAddNew : true})
      }}/>
      <ScrollView>
      {chats?.sort((a,b) => b.timestamp - a.timestamp)?.map( (chat, index) =>
        <ListItem
        name={chat.name}
        key={chat._id}
        image={chat.image}
        textStyle={{fontWeight : "bold", fontSize : customStyle.scaledUIFontSize}}
        containerStyle={index === (chats?.length -1) && ({borderBottomWidth : 0})}
        highlightedStyle={{backgroundColor : "rgba(0,0,0,0.1)"}}
        subTextStyle={{
          fontSize : customStyle.scaledSubTextSize,
          color : chat.lastMessageSentBySelf ? displayedSentTextColor : displayedReceivedTextColor,
          ...(!chat.lastMessageSentBySelf && chat.hasNewMessages && {fontWeight : "bold"})
        }}
        rightTextStyle={{
          marginRight : 10,
          fontSize : customStyle.scaledSubTextSize,
          color : chat.lastMessageSentBySelf ? displayedSentTextColor : displayedReceivedTextColor,
          ...(chat.hasNewMessages && {fontWeight : "bold"})
        }}
        rightIcon={chat.hasNewMessages && "circle"}
        rightIconSize={18}
        rightIconStyle={{color : palette.primary}}
        onPress={() => handlePress(chat._id)}
        onLongPress={() => handleLongPress(chat._id)}
        highlighted={highlightedChats.includes(chat._id)}
        rightText={chat.timestamp && timestampToText(chat.timestamp,"DD/MM")}
        subText={chat.lastText.trim()}/>
      )}
      </ScrollView>

      <ConfirmationModal
      visible={showConfirmationModal}
      onConfirm={() => {
        const chatsToDelete = highlightedChats.map(id => chats.find(chat => chat._id === id)?.key);
        dispatch(deleteChatsFromState(highlightedChats));
        deleteChatsFromRealm(chatsToDelete);
        setHighlightedChats([]);
        setShowConfirmationModal(false);
      }}
      onCancel={() => setShowConfirmationModal(false)}
      titleText="Are you sure you want to delete these chats?"/>
    </>
  )
}

export default Chats;
