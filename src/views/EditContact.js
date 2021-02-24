import React, { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, Text, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';


const EditContact = ({ route }) => {
  const [name, setName] = useState(route.params.username)
  const [publicKey, setPublicKey] = useState("");
  const [savedContacts,setSavedContacts] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    loadContactInfo()
  },[])

  const loadContactInfo = async () => {
    const contacts = JSON.parse(await AsyncStorage.getItem("contacts"));
    setSavedContacts(contacts);
    const contact = contacts.find(savedContact => savedContact.name === route.params.username);

    if(contact) {
      setPublicKey(contact.key);
    }
  }

  const save = async () => {
    setError("");
    if(savedContacts.find(contact => contact.name === name) && name !== route.params.username) {
      return setError("User already exists")
    }
    else {
      var oldContact = savedContacts.find(contact => contact.name === route.params.username);
      var newContact = {...oldContact,name : name,key : publicKey};
      await AsyncStorage.setItem("contacts",JSON.stringify([
        ...savedContacts.filter(contact => contact.name !== route.params.username),
        newContact
      ]))
    }
  }

  return (
    <View>
      <Text>{error}</Text>
      <TextInput
      style={styles.input}
      onChangeText={text => setName(text)}
      value={name}/>

      <TextInput
      multiline={true}
      style={styles.input}
      onChangeText={text => setPublicKey(text)}
      value={publicKey}/>

      <TouchableOpacity
      style={styles.button}
      onPress={save}>
        <Text style={styles.buttonText}>Save</Text>
      </TouchableOpacity>

    </View>
  )
}

const styles = {
  button : {
    backgroundColor : "#E86252",
    padding : 10,
    alignSelf : "center",
    marginTop : 10,
    borderRadius : 5
  },
  buttonText : {
    color : "white",
    fontWeight : "bold",
    fontFamily : "Open-Sans",
    textAlign : "center"
  },
  input : {
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom : 10,
    width : Dimensions.get('window').width * 0.9,
    alignSelf : "center"
  }
}

export default EditContact;
