import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Text, View, TouchableOpacity, Dimensions, Image, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from './Header';
import ListItem from './ListItem';
import { getContactsWithChats, deleteChats as deleteChatsFromRealm } from '../realm/chatRealm';
import { parseRealmID } from '../realm/helper';
import { toHsv } from 'react-native-color-picker';

import { deleteChats as deleteChatsFromState } from '../redux/actions/chatActions';

import { palette } from '../assets/palette';

import { timestampToText } from '../helper';

const Chats = ({ navigation }) => {
  const dispatch = useDispatch();

  const chats = useSelector(state => state.chatReducer.chats);
  const customStyle = useSelector(state => state.chatReducer.styles);
  const [highlightedChats, setHighlightedChats ] = useState([]);

  const checkStyleReadable = style => {
      const hsv = toHsv(style);
      if(hsv.h < 10 && hsv.s < 10 && hsv.v > 0.95) {
        return palette.grey
      }
      else {
        return style
      }
  }

  const deleteChat = chat => {
    Alert.alert(
      'Are you sure ?',
      '',
      [
        { text: "Cancel", style: 'cancel', onPress: () => {} },
        {
          text: 'Delete',
          style: 'destructive',
          // If the user confirmed, then we dispatch the action we blocked earlier
          // This will continue the action that had triggered the removal of the screen
          onPress: () => {
            dispatch(deleteChatsFromState(highlightedChats))
            deleteChatsFromRealm(highlightedChats.map(chat => chat.key))
          },
        },
      ]
    );
  }

  const handleLongPress = chat => {
    if(highlightedChats.indexOf(chat) == -1) {
      setHighlightedChats([...highlightedChats,chat]);
    }
  }

  const handlePress = chat => {
    if(highlightedChats.length > 0) {
      const chatIndex = highlightedChats.indexOf(chat);
      if(chatIndex === -1) {
        setHighlightedChats([...highlightedChats,chat]);
      }
      else {
        setHighlightedChats([...highlightedChats].filter(highlightedChat => highlightedChat !== chat));
      }
    }
    else {
      navigation.navigate("chat", {contactID : parseRealmID(chat)})
    }
  }

  return (
    <>
      <Header
      title="Chats"
      rightButtonIcon="add"
      rightButtonOnClick={() => navigation.navigate("newChat",{type : "newChat", disableAddNew : true})}/>
      <ScrollView>
      {chats?.sort((a,b) => a.timestamp < b.timestamp)?.map( (chat, index) =>
        <ListItem
        name={chat.name}
        key={chat._id}
        navigation={navigation}
        image={chat.image}
        textStyle={{fontWeight : "bold", fontSize : customStyle.uiFontSize}}
        containerStyle={index === (chats?.length -1) && ({borderBottomWidth : 0})}
        subTextStyle={{
          fontSize : customStyle.subTextSize,
          color : chat.lastMessageSentBySelf ? checkStyleReadable(customStyle.sentTextColor) : checkStyleReadable(customStyle.receivedTextColor),
          ...(!chat.lastMessageSentBySelf && {fontWeight : "bold"})
        }}
        rightTextStyle={{
          width: Dimensions.get('window').width * 0.20,
          maxWidth : 150,
          marginRight : 0,
          textAlign : "center",
          fontSize : customStyle.subTextSize,
          color : chat.lastMessageSentBySelf ? checkStyleReadable(customStyle.sentTextColor) : checkStyleReadable(customStyle.receivedTextColor),
          ...(!chat.lastMessageSentBySelf && {fontWeight : "bold"})
        }}
        rightIcon={!chat.lastMessageSentBySelf && "circle"}
        rightIconSize={18}
        rightIconStyle={{color : palette.primary}}
        onPress={() => handlePress(chat)}
        onLongPress={() => handleLongPress(chat)}
        highlighted={highlightedChats.indexOf(chat) !== -1}
        deleteItem={() => deleteChat(chat)}
        rightText={chat.timestamp && timestampToText(chat.timestamp,"DD/MM")}
        subText={chat.lastText}/>
      )}
      </ScrollView>
    </>
  )
}

export default Chats;
