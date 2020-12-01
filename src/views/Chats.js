import React, { useState } from 'react';
import { Text, View, TouchableOpacity } from 'react-native';

const Chats = ({ navigation }) => {
  const [chats,setChats] = useState([{name : "Test1"},{name : "Test2"},{name : "Test3"}]);
  return (
    <>
    <View style={styles.header}>
      <Text style={{color : "white", fontSize : 18}}>
        Chats
      </Text>
    </View>
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
