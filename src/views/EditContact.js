import React, { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { View, TextInput, TouchableOpacity, Text, Dimensions, Image, Alert,
         ActivityIndicator, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from './Header';
import {launchImageLibrary} from 'react-native-image-picker';
import ContactImage from './ContactImage';
import FlashTextButton from './FlashTextButton';

import { getContactById, editContact } from '../realm/contactRealm';
import { largeImageContainerStyle } from '../assets/styles';
import Crypto from '../nativeWrapper/Crypto';

import { updateContact } from '../redux/actions/contactActions';

const EditContact = ({ route, navigation }) => {
  const dispatch = useDispatch();
  const [name, _setName] = useState("");
  const [publicKey, _setPublicKey] = useState("");
  const [savedContacts,setSavedContacts] = useState([]);
  const [originalContact, setOriginalContact] = useState({});
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
    const contact = getContactById(route.params.id)
    setOriginalContact(contact);
    if(contact) {
      setName(contact.name)
      setPublicKey(contact.key);
      setContactImage(contact.image);
    }
  }

  const save = async () => {
    setError("");
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
    const newInfo = {name : name.trim(), key : publicKey.trim(), image : contactImage};
    editContact(route.params.id, newInfo);
    dispatch(updateContact({...newInfo,_id : route.params.id}));
    setOriginalContact(newInfo);
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
      const contact = getContactById(route.params.id);

      if(contact) {
        const unsavedChanges = (
          contact.name.trim() != nameRef.current.trim() ||
          contact.key.trim() != keyRef.current.trim() ||
          contact.image != imageRef.current
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
      </ScrollView>}
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
