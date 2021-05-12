import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, TouchableOpacity, Text, Dimensions, Image, Alert,
         ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from './Header';
import {launchImageLibrary} from 'react-native-image-picker';
import ContactImage from './ContactImage';


const EditContact = ({ route, navigation }) => {
  const [name, _setName] = useState(route.params.username)
  const [publicKey, _setPublicKey] = useState("");
  const [savedContacts,setSavedContacts] = useState([]);
  const [contactImage, _setContactImage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const nameRef = useRef();
  const keyRef = useRef();
  const imageRef = useRef();

  //refs for accessing state in event listeners, used to prevent discarding unsaved changes
  const setPublicKey = data => {
    keyRef.current = data;
    _setPublicKey(data)
  }
  const setName = data => {
    nameRef.current = data;
    _setName(data)
  }
  const setContactImage = data => {
    imageRef.current = data;
    _setContactImage(data)
  }

  useEffect(() => {
    loadContactInfo().then(() => setLoading(false));
  },[])

  const loadContactInfo = async () => {
    const contacts = JSON.parse(await AsyncStorage.getItem("contacts"));
    setSavedContacts(contacts);
    const contact = contacts.find(savedContact => savedContact.name === route.params.username);

    if(contact) {
      setName(contact.name)
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
    const beforeGoingBack = navigation.addListener('beforeRemove', async (e) => {
      e.preventDefault();
      const contacts = JSON.parse(await AsyncStorage.getItem("contacts"));
      const contact = contacts.find(savedContact => savedContact.name === route.params.username);

      if(contact) {

        const unsavedChanges = (
          contact.name != nameRef.current ||
          contact.key != keyRef.current ||
          contact.image != imageRef.current
        )

        if(unsavedChanges) {
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
        else {
          navigation.dispatch(e.data.action);
        }
      }
    })

    return beforeGoingBack;
  },[navigation])

  return (
    <>
      <Header title="Edit Contact" allowGoBack/>
      {loading ?
      <ActivityIndicator size="large" color="#e05e3f"/>
      :
      <View style={styles.container}>
        <Text>{error}</Text>

        <TouchableOpacity style={{alignSelf : "center"}} onPress={editImage}>
          <View style={styles.imageContainer}>
            <ContactImage
            contactName={route.params.username}
            iconSize={64}
            imageWidth={Dimensions.get("window").width * 0.4}
            imageHeight={Dimensions.get("window").height * 0.4}/>
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

      </View>}
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
    borderRadius : 5,
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
    overflow : "hidden",
    backgroundColor : "white"
  },
  image : {
    width : Dimensions.get("window").width * 0.4,
    height : Dimensions.get("window").width * 0.4,
  }
}

export default EditContact;
