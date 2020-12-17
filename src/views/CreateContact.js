import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'

const CreateContact = ({navigation}) => {
  const [username, setUsername] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [error, setError] = useState("");

  const createContact = async () => {
    setError("");
    if(username.trim() === "" || publicKey.trim() === "") {
      return setError("Fields Cannot be empty")
    }
  }

  return (
    <View style={{padding : 20}}>
      <Text style={styles.error}>{error}</Text>
      <TextInput
      placeholder="Name"
      onChange={setUsername}
      style={styles.input}/>
      <TextInput
      placeholder="Public Key"
      onChange={setPublicKey}
      style={styles.input}/>
      <TouchableOpacity
      style={styles.button}
      onPress={() => createContact()}>
        <Text style={styles.buttonText}>Import</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = {
  input : {
    backgroundColor : "white",
    padding : 10,
    marginBottom : 10
  },
  button : {
    backgroundColor : "#E86252",
    padding : 10,
    alignSelf : "center",
    marginTop : 10,
    borderRadius : 5
  },
  buttonText : {
    color : "white"
  },
  error : {
    color : "red",
    fontWeight : "bold",
    alignSelf : "center",
    marginBottom : 10
  }
}

export default CreateContact;
