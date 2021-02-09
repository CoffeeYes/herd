import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'

const CreateContact = ({ navigation, route}) => {
  const [username, setUsername] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    route?.params?.publicKey && setPublicKey(route.params.publicKey);
  },[])

  const createContact = async () => {
    setError("");
    console.log(username);
    console.log(publicKey);
    if(username.trim() === "" || publicKey.trim() === "") {
      setError("Fields Cannot be empty")
    }
    else {
      var contacts = JSON.parse(await AsyncStorage.getItem("contacts"));
      //create empty contacts array and load it back
      if(!contacts) {
        await AsyncStorage.setItem("contacts",JSON.stringify([]));
        contacts = await AsyncStorage.getItem("contacts");
      }

      //create new user if the username isnt taken
      if(!(contacts.find(user => user.name === username))) {
        await AsyncStorage.setItem("contacts",JSON.stringify([...contacts,{
          name : username,
          key : publicKey
        }]))
        navigation.navigate("main");
      }
      else {
        setError("You Already have a contact with that username")
      }
    }
  }

  return (
    <View style={{padding : 20}}>
      <Text style={styles.error}>{error}</Text>

      <TextInput
      placeholder="Name"
      onChangeText={name => setUsername(name)}
      defaultValue={""}
      style={styles.input}/>

      <TextInput
      placeholder="Public Key"
      onChangeText={key => setPublicKey(key)}
      style={styles.input}
      editable={!route?.params?.publicKey}
      value={publicKey}/>

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
