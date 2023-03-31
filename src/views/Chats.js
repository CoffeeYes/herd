import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Text, View, TouchableOpacity, Dimensions, Image, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from './Header';
import ListItem from './ListItem';
import { getContactsWithChats, deleteChat as deleteChatFromRealm } from '../realm/chatRealm';
import { parseRealmID } from '../realm/helper';
import { toHsv } from 'react-native-color-picker';

import { deleteChat as deleteChatFromState } from '../redux/actions/chatActions';

import { palette } from '../assets/palette';

import { timestampToText } from '../helper';

const Chats = ({ navigation }) => {
  const dispatch = useDispatch();

  const chats = useSelector(state => state.chatReducer.chats);
  const customStyle = useSelector(state => state.chatReducer.styles);

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
            dispatch(deleteChatFromState(chat))
            deleteChatFromRealm(chat.key)
          },
        },
      ]
    );

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
        onPress={() => navigation.navigate("chat", {contactID : parseRealmID(chat)})}
        deleteItem={() => deleteChat(chat)}
        rightText={chat.timestamp && timestampToText(chat.timestamp,"DD/MM")}
        subText={chat.lastText}/>
      )}
      </ScrollView>
    </>
  )
}

export default Chats;
