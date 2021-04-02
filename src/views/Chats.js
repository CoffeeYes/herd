import React, { useState, useEffect } from 'react';
import { Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Header from './Header'

const ChatItem = ({name, navigation, reloadChats}) => {
  const [showDelete, setShowDelete] = useState(false);

  const deleteChat = async name => {
    await AsyncStorage.setItem(name,JSON.stringify({
      sent : [],
      received : [],
      sentCopy :  []
    }));
    setShowDelete(false);
    reloadChats();
  }

  return (
    <TouchableOpacity
    style={{...styles.chat,padding : showDelete ? 0 : 20, paddingLeft : 20}}
    onPress={() => navigation.navigate("chat", {username : name})}
    onLongPress={() => setShowDelete(!showDelete)}>
      <Text style={styles.chatText}>{name}</Text>
      {showDelete &&
      <TouchableOpacity
      style={styles.deleteButton}
      onPress={() => {
        setShowDelete(false);
        deleteChat(name);
      }}>
        <Icon name="delete" size={24} style={{color : "black"}}/>
      </TouchableOpacity>}
    </TouchableOpacity>
  )
}

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
        const userData = JSON.parse(await AsyncStorage.getItem(contact.name));
        if(userData?.received?.length > 0 || userData?.sentCopy?.length > 0) {
          chatsWithMessages.push({name : contact.name})
        }
      }))
      setChats(chatsWithMessages)
    }
  }

  return (
    <>
      <Header
      title="Chats"
      rightButtonIcon="add"
      rightButtonOnClick={() => navigation.navigate("newChat",{type : "newChat", disableAddNew : true})}/>

      {loading && <ActivityIndicator size="large" color="#e05e3f"/>}

      {chats?.map( (chat, index) =>
        <ChatItem name={chat.name} key={index} navigation={navigation} reloadChats={loadContactsWithChats}/>
      )}
    </>
  )
}

const styles = {
  chat : {
    flexDirection : "row",
    flex : 1,
    backgroundColor : "white",
    alignItems : "center",
    justifyContent : "space-between",
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
  },
  deleteButton : {
    backgroundColor : "#e05e3f",
    padding : 13,
    paddingVertical : 20
  },
}

export default Chats;
