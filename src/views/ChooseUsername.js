import React, { useState } from 'react';
import { View, TextInput, Text, Button } from 'react-native';
import palette from '../assets/palette';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ChooseUsername = ({ navigation }) => {
  const [username, setUsername] = useState("");
  const [error,setError] = useState("");

  const storeUsername = async () => {
    setError("");
    const usernameRegex = /^[a-zA-Z_]+$/;
    if(!usernameRegex.test(username)) {
      setError("Username can only contain letters and undescore")
    }
    else {
      await AsyncStorage.setItem('@username',username);
      navigation.navigate("main")
    }
  }

  return (
    <View style={{
      flex : 1,
      alignItems : "center",
      justifyContent : "center",
      backgroundColor : "#e05e3f"}}>
        <Text style={{textAlign : "center",fontSize : 18,color : "white"}}>
        Choose your username. This username will be attached to every message at
        the time of sending.
        </Text>
        <Text style={{color : "red", fontWeight : "bold"}}>{error}</Text>
        <TextInput
        placeholder="Username"
        style={{
          height : 40,
          backgroundColor : "white",
          minWidth : 250,
          marginVertical : 20,
          borderWidth : 1,
          borderColor : palette.primary,
          borderRadius : 5
        }}
        onChangeText={text => setUsername(text)}
        value={username}/>

        <Button
        title="Next"
        onPress={storeUsername}
        color={palette.secondary}
        />
    </View>
  )
}

export default ChooseUsername
