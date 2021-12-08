import React, { useState, useEffect } from 'react';
import { Text, View, TouchableOpacity, ActivityIndicator, Dimensions, Image, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from './Header';
import ListItem from './ListItem';
import { getContactsWithChats, deleteChat as deleteChatFromRealm } from '../realm/chatRealm';
import { parseRealmID } from '../realm/helper';
import moment from 'moment'

const Chats = ({ navigation }) => {
  const [chats,setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContactsWithChats();
  },[])

  useEffect(() => {
    const focusListener = navigation.addListener('focus', () => {
      loadContactsWithChats();
    });
    return focusListener;
  },[navigation])

  const loadContactsWithChats = async () => {
    setLoading(true);
    //create array copy using slice, then sort by timestamp
    var contactsWithChats = await getContactsWithChats();
    contactsWithChats = contactsWithChats.slice()
    .sort( (a,b) => a.timestamp > b.timestamp);

    setChats(contactsWithChats);
    setLoading(false);
  }

  const deleteChat = async key => {
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
          onPress: async () => {
            deleteChatFromRealm(key)
            loadContactsWithChats();
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

      {loading && <ActivityIndicator size="large" color="#e05e3f"/>}
      <ScrollView>
      {chats?.map( (chat, index) =>
        <ListItem
        name={chat.name}
        key={index}
        navigation={navigation}
        image={chat.image}
        onPress={() => navigation.navigate("chat", {contactID : parseRealmID(chat)})
        }
        deleteItem={() => deleteChat(chat.key)}
        rightText={chat.timestamp &&
          (moment(chat.timestamp).format("DD/MM") === moment().format("DD/MM") ?
            "Today"
            :
            moment(chat.timestamp).format("DD/MM"))
        }/>
      )}
      </ScrollView>
    </>
  )
}

export default Chats;
