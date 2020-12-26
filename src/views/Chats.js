import React, { useState, useEffect } from 'react';
import { Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Chats = ({ navigation }) => {
  const [chats,setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContactsWithChats().then(() => setLoading(false))
  },[])

  const loadContactsWithChats = async () => {
    //load all contacts from storage
    const contacts = JSON.parse(await AsyncStorage.getItem("contacts"));

    //check storage for each contact to see if messages have been sent/received
    //and add them to contact list if so
    contacts.forEach(async contact => {
      const chat = JSON.parse(await AsyncStorage.getItem(contact.name));
      if(chat) {
        setChats([...chats,{name : contact.name}])
      }
    })
  }

  return (
    <>
    <View style={styles.header}>
      <Text style={{color : "white", fontSize : 18}}>
        Chats
      </Text>
    </View>
    {loading && <ActivityIndicator size="large" color="#e05e3f"/>}
    {chats.map( (chat, index) =>
      <TouchableOpacity
      key={index}
      style={styles.chat}
      onPress={() => navigation.navigate("chat", {username : chat.name})}>
        <Text>{chat.name}</Text>
      </TouchableOpacity>
    )}
    </>
  )
}

const styles = {
  chat : {
    flexDirection : "row",
    flex : 1,
    padding : 20,
    backgroundColor : "white",
    alignItems : "space-between",
    borderBottomWidth : 1,
    borderBottomColor : "#e05e3f"
  },
  header : {
    flexDirection : "row",
    justifyContent : "space-between",
    alignItems : "center",
    backgroundColor : "#e05e3f",
    paddingLeft : 20,
    padding : 15
  }
}

export default Chats;
