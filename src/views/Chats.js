import React, { useState, useEffect } from 'react';
import { Text, View, TouchableOpacity, ActivityIndicator, Dimensions, Image, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from './Header';
import ListItem from './ListItem'

const Chats = ({ navigation }) => {
  const [chats,setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContactsWithChats().then(() => setLoading(false))
  },[])

  useEffect(() => {
    const focusListener = navigation.addListener('focus', () => {
      setLoading(true)
      loadContactsWithChats().then(() => setLoading(false));
    });

    return focusListener;
  },[navigation])

  const loadContactsWithChats = async () => {
    //load all contacts from storage
    const contacts = JSON.parse(await AsyncStorage.getItem("contacts"));

    //check storage for each contact to see if messages have been sent/received
    //and add them to contact list if so
    var chatsWithMessages = []
    if(contacts) {
      await Promise.all(contacts.map(async contact => {
        const userData = JSON.parse(await AsyncStorage.getItem(contact.id));
        if(userData?.received?.length > 0 || userData?.sentCopy?.length > 0) {
          chatsWithMessages.push({name : contact.name,image : contact.image, contactID : contact.id})
        }
      }))
      setChats(chatsWithMessages)
    }
  }

  const deleteChat = async contactID => {
    await AsyncStorage.setItem(contactID,JSON.stringify({
      sent : [],
      received : [],
      sentCopy :  []
    }));
    loadContactsWithChats();
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
        onPress={() => navigation.navigate("chat", {contactID : chat.contactID})}
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
