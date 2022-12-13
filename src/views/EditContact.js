import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { View, TextInput, TouchableOpacity, Text, Dimensions, Image, Alert,
         ActivityIndicator, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Header from './Header';
import {launchImageLibrary} from 'react-native-image-picker';
import ContactImage from './ContactImage';
import FlashTextButton from './FlashTextButton';

import { getContactById, editContact, getContactByName, getContactsByKey } from '../realm/contactRealm';
import { largeImageContainerStyle } from '../assets/styles';
import Crypto from '../nativeWrapper/Crypto';

import { updateContact } from '../redux/actions/contactActions';
import { updateContactAndReferences } from '../redux/actions/combinedActions';

const EditContact = ({ route, navigation }) => {
  const dispatch = useDispatch();
  const originalContact = useSelector(state => state.contactReducer.contacts.find(contact => contact._id === route.params.id))
  const [name, _setName] = useState(originalContact.name);
  const [publicKey, _setPublicKey] = useState(originalContact.key);
  const [contactImage, _setContactImage] = useState(originalContact.image);
  const [error, setError] = useState("");

  const nameRef = useRef(originalContact.name);
  const keyRef = useRef(originalContact.key);
  const imageRef = useRef(originalContact.image);
  const originalContactRef = useRef(originalContact);

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
    originalContactRef.current = originalContact
  },[originalContact])


  const save = async () => {
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
      setError("Invalid Public Key")
      console.log(e)
      return false;
    }
    if(name.trim().length === 0) {
      setError("Username can not be empty");
      return false;
    }
    const keyExists = getContactsByKey([publicKey.trim()]);
    const nameExists = getContactByName(name.trim());

    if(keyExists != "" && keyExists[0].key != originalContact.key) {
      setError("A user with this key already exists");
      return false;
    }
    if(nameExists && nameExists.name != originalContact.name) {
      setError("A user with this name already exists");
      return false;
    }
    setError("");
    const newInfo = {name : name.trim(), key : publicKey.trim(), image : contactImage};
    editContact(route.params.id, newInfo);
    updateContactAndReferences(dispatch, {...newInfo,_id : route.params.id});
    return true;
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
        originalContactRef.current.name.trim() != nameRef.current.trim() ||
        originalContactRef.current.key.trim() != keyRef.current.trim() ||
        originalContactRef.current.image != imageRef.current
      )

      if(unsavedChanges) {
        Alert.alert(
          'Discard changes?',
          'You have unsaved changes. Are you sure to discard them and leave the screen?',
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
      <Header title="Edit Contact" allowGoBack/>
      <ScrollView contentContainerStyle={styles.container}>

        <TouchableOpacity style={{alignSelf : "center"}} onPress={editImage}>
          <View style={largeImageContainerStyle}>
            <ContactImage
            imageURI={contactImage}
            iconSize={64}
            imageWidth={Dimensions.get("window").width * 0.4}
            imageHeight={Dimensions.get("window").height * 0.4}/>
          </View>
        </TouchableOpacity>

        <Text style={styles.error}>{error}</Text>

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

        <FlashTextButton
        normalText="Save"
        flashText="Saved!"
        onPress={save}
        timeout={500}
        disabled={
          (name.trim() === originalContact.name.trim() || name === originalContact.name) &&
          (publicKey.trim() === originalContact.key.trim() || publicKey === originalContact.key) &&
          contactImage === originalContact.image
        }
        buttonStyle={styles.button}
        textStyle={styles.buttonText}/>
      </ScrollView>
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
  error : {
    color : "red",
    fontWeight : "bold",
    alignSelf : "center"
  }
}

export default EditContact;
