import React, { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, Text, Dimensions, Image, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from './Header';
import {launchImageLibrary} from 'react-native-image-picker';


const EditContact = ({ route, navigation }) => {
  const [name, setName] = useState(route.params.username)
  const [publicKey, setPublicKey] = useState("");
  const [savedContacts,setSavedContacts] = useState([]);
  const [contactImage, setContactImage] = useState("");
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
      setContactImage(contact.image);
    }
  }

  const save = async () => {
    setError("");
    if(savedContacts.find(contact => contact.name === name.trim()) && name.trim() !== route.params.username) {
      return setError("User already exists")
    }
    else {
      var oldContact = savedContacts.find(contact => contact.name === route.params.username);
      var newContact = {...oldContact,name : name.trim(),key : publicKey.trim(), image : contactImage};
      await AsyncStorage.setItem("contacts",JSON.stringify([
        ...savedContacts.filter(contact => contact.name !== route.params.username),
        newContact
      ]))
      navigation.goBack();
    }
  }

  const editImage = async () => {
    setError("");
    const options = {
      mediaType : 'photo',
      includeBase64 : true
    }
    launchImageLibrary(options,response => {
      if(response.errorCode) {
        setError(response.errorMessage)
      }
      else if(!response.didCancel) {
        setContactImage("data:" + response.type + ";base64," + response.base64);
      }
    });
  }

  useEffect(() => {
    navigation.addListener('beforeRemove', async (e) => {
      const contacts = JSON.parse(await AsyncStorage.getItem("contacts"));
      setSavedContacts(contacts);
      const contact = contacts.find(savedContact => savedContact.name === route.params.username);

      if(contact) {
        const unsavedChanges = (
          contact.image != contactImage ||
          contact.name != name ||
          contact.key != publicKey
        )

        if(unsavedChanges) {
          e.preventDefault();
          console.log("changed image")
          Alert.alert(
            'Discard changes?',
            'You have unsaved changes. Are you sure to discard them and leave the screen?',
            [
              { text: "Don't leave", style: 'cancel', onPress: () => {} },
              {
                text: 'Discard',
                style: 'destructive',
                // If the user confirmed, then we dispatch the action we blocked earlier
                // This will continue the action that had triggered the removal of the screen
                onPress: () => navigation.dispatch(e.data.action),
              },
            ]
          );
        }
      }
    })
  },[navigation])

  return (
    <>
      <Header title="Edit Contact" allowGoBack/>
      <View style={styles.container}>
        <Text>{error}</Text>

        <TouchableOpacity style={{alignSelf : "center"}} onPress={editImage}>
          <View style={styles.imageContainer}>
            {contactImage ?
            <Image
            source={{uri : contactImage}}
            style={styles.image}/>
            :
            <Icon name="contact-page" size={64} style={styles.icon}/>
            }
          </View>
        </TouchableOpacity>

        <Text style={styles.inputTitle}>Name</Text>
        <TextInput
        style={styles.input}
        onChangeText={text => setName(text)}
        value={name}/>

        <Text style={styles.inputTitle}>Public Key</Text>
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
    </>
  )
}

const styles = {
  container : {
    padding : 20,
    alignItems : "flex-start"
  },
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
    alignSelf : "center",
    padding : 10,
    backgroundColor : "white",
    borderRadius : 5
  },
  inputTitle : {
    fontWeight : "bold",
    marginBottom : 5
  },
  imageContainer : {
    alignSelf : "center",
    width : Dimensions.get("window").width * 0.4,
    height : Dimensions.get("window").width * 0.4,
    borderRadius : Dimensions.get("window").width * 0.2,
    borderWidth : 1,
    borderColor : "grey",
    alignItems : "center",
    justifyContent : "center",
    overflow : "hidden"
  },
  image : {
    width : Dimensions.get("window").width * 0.4,
    height : Dimensions.get("window").width * 0.4,
  }
}

export default EditContact;
