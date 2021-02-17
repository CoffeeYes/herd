import React, { useState, useEffect } from 'react';
import { View, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'

const EditContact = ({ route }) => {
  const [name, setName] = useState(route.params.username)
  const [publicKey, setPublicKey] = useState("");

  useEffect(() => {
    loadContactInfo()
  },[])

  const loadContactInfo = async () => {
    const contacts = JSON.parse(await AsyncStorage.getItem("contacts"));
    const contact = contacts.find(savedContact => savedContact.name === route.params.username);
    
    if(contact) {
      setPublicKey(contact.key);
    }
  }

  return (
    <View>
      <TextInput
      style={{ height: 40, borderColor: 'gray', borderWidth: 1 }}
      onChangeText={text => onChangeText(text)}
      value={name}/>

      <TextInput
      multiline
      style={{ height: 40, borderColor: 'gray', borderWidth: 1 }}
      onChangeText={text => onChangeText(text)}
      value={publicKey}/>

    </View>
  )
}

export default EditContact;
