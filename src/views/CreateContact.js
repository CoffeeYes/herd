import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Dimensions, Image, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Crypto from '../nativeWrapper/Crypto';
import Header from './Header';
import Icon from 'react-native-vector-icons/MaterialIcons'
import ContactImage from './ContactImage';
import CustomButton from './CustomButton';
import {launchImageLibrary} from 'react-native-image-picker';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { createContact, getContactsByKey } from '../realm/contactRealm';

const CreateContact = ({ navigation, route}) => {
  const [username, _setUsername] = useState("");
  const [publicKey, _setPublicKey] = useState("");
  const [error, setError] = useState("");
  const [contactImage, _setContactImage] = useState("");

  const usernameRef = useRef();
  const publicKeyRef = useRef();
  const imageRef = useRef();

  const setUsername = value => {
    usernameRef.current = value;
    _setUsername(value);
  }

  const setPublicKey = value => {
    publicKeyRef.current = value;
    _setPublicKey(value);
  }

  const setContactImage = value => {
    imageRef.current = value;
    _setContactImage(value);
  }

  useEffect(() => {
    imageRef.current = "";
    route?.params?.publicKey ? setPublicKey(route.params.publicKey) : publicKeyRef.current = "";
    route?.params?.name ? setUsername(route.params.name) : usernameRef.current = "";
  },[])

  const createNewContact = async () => {
    setError("");

    if(username.trim() === "" || publicKey.trim() === "") {
      setError("Fields Cannot be empty")
    }
    else {
      //test public key
      try {
        const encryptedTest = await Crypto.encryptStringWithKey(
          publicKey.trim(),
          Crypto.algorithm.RSA,
          Crypto.blockMode.ECB,
          Crypto.padding.OAEP_SHA256_MGF1Padding,
          "test"
        )
      }
      catch(e) {
        return setError("Invalid Public Key")
      }

      //check for duplicate contacts
      const contactExists = getContactsByKey([publicKey]);
      if(contactExists != "") {
        return setError("A contact with this key already exists")
      }

      const newContact = {
        key : publicKey,
        name : username,
        image : contactImage
      }
      createContact(newContact);
      setUsername("");
      setPublicKey("");
      setContactImage("");
      navigation.navigate('main');
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

      const unsavedChanges = (
        usernameRef.current.trim() != "" ||
        publicKeyRef.current.trim() != "" ||
        imageRef.current.trim() != ""
      )

      if(unsavedChanges) {
        Alert.alert(
          'Discard changes?',
          'You have unsaved changes. Are you sure you want to discard them ?',
          [
            {
              text: 'Discard',
              style: 'destructive',
              // If the user confirmed, then we dispatch the action we blocked earlier
              // This will continue the action that had triggered the removal of the screen
              onPress: () => navigation.dispatch(e.data.action),
            },
            { text: "Stay", style: 'cancel', onPress: () => {} },
          ]
        );
      }
      else {
        navigation.dispatch(e.data.action);
      }
    })

    return beforeGoingBack;
  },[navigation])

  return (
    <>
      <Header title="Create Contact" allowGoBack/>

      <ScrollView contentContainerStyle={{padding : 20}}>
        <Text style={styles.error}>{error}</Text>

        <TouchableOpacity style={{alignSelf : "center"}} onPress={editImage}>
          <View style={styles.imageContainer}>
            <ContactImage
            imageURI={contactImage}
            iconSize={64}
            imageWidth={Dimensions.get("window").width * 0.4}
            imageHeight={Dimensions.get("window").height * 0.4}/>
          </View>
        </TouchableOpacity>

        <TextInput
        placeholder="Name"
        onChangeText={name => setUsername(name)}
        value={username}
        style={styles.input}/>

        <TextInput
        placeholder="Public Key"
        onChangeText={key => setPublicKey(key)}
        style={styles.input}
        editable={!route?.params?.publicKey}
        value={publicKey}/>

        <CustomButton
        text="Import"
        onPress={createNewContact}
        disabled={username.trim().length === 0 || publicKey.trim().length === 0}/>

      </ScrollView>
  </>
  )
}

const styles = {
  input : {
    backgroundColor : "white",
    padding : 10,
    marginBottom : 10
  },
  error : {
    color : "red",
    fontWeight : "bold",
    alignSelf : "center",
    marginBottom : 10,
    fontFamily : "Open-Sans"
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
    backgroundColor : "white",
    marginBottom : 20
  },
}

export default CreateContact;
