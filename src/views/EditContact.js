import React, { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'

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
      style={{ height: 40, borderColor: 'gray', borderWidth: 1 }}
      onChangeText={text => setName(text)}
      value={name}/>

      <TextInput
      multiline
      style={{ height: 40, borderColor: 'gray', borderWidth: 1 }}
      onChangeText={text => onChangeText(text)}
      value={publicKey}/>

      <TouchableOpacity
      onPress={save}>
        <Text>Save</Text>
      </TouchableOpacity>

    </View>
  )
}

export default EditContact;
