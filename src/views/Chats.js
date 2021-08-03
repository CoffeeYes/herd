import React, { useState, useEffect } from 'react';
import { Text, View, TouchableOpacity, ActivityIndicator, Dimensions, Image, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from './Header';
import ListItem from './ListItem';
import { getContactsWithChats } from '../realm/chatRealm'

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

  const loadContactsWithChats = () => {
    setLoading(true);
    setChats(getContactsWithChats());
    setLoading(false);
  }

  const deleteChat = async contactID => {
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
            await AsyncStorage.setItem(contactID,JSON.stringify({
              sent : [],
              received : [],
              sentCopy :  []
            }));
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
        onPress={() => navigation.navigate("chat", {contactID : chat._id[1]})}
        deleteItem={() => deleteChat(chat.contactID)}
        />
      )}
      </ScrollView>
    </>
  )
}

const styles = {
  chat : {
    flexDirection : "row",
    flex : 1,
    backgroundColor : "white",
    alignItems : "center",
    justifyContent : "flex-start",
    borderBottomWidth : 0.2,
    borderBottomColor : "#e05e3f"
  },
  header : {
    flexDirection : "row",
    justifyContent : "space-between",
    alignItems : "center",
    backgroundColor : "#e05e3f",
    paddingLeft : 20,
  },
  headerText : {
    fontSize : 18,
    color : "white"
  }
}

export default Chats;
