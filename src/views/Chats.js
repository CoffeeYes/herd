import React, { useState } from 'react';
import { Text, View, TouchableOpacity } from 'react-native';

const Chats = ({ navigation }) => {
  const [chats,setChats] = useState([{name : "Test1"},{name : "Test2"},{name : "Test3"}]);
  return (
    <>
    {chats.map(chat =>
      <TouchableOpacity
      style={styles.chat}
      onPress={() => navigation.navigate("chat")}>
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
  }
}

export default Chats;
