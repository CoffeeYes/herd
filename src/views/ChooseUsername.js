import React, { useState } from 'react';
import { View, TextInput, Text, Button } from 'react-native';
import palette from '../assets/palette';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ChooseUsername = ({ }) => {
  const [username, setUsername] = useState("");

  const storeUsername = async () => {
    await AsyncStorage.setItem('@username',username);
  }
  
  return (
    <View style={{
      flex : 1,
      alignItems : "center",
      justifyContent : "center"}}>
        <Text style={{textAlign : "center"}}>
        Choose your username. This username will be attached to every message at
        the time of sending.
        </Text>

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
