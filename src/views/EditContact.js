import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { View, TextInput, TouchableOpacity, Text, Dimensions, Image, Alert,
         ActivityIndicator, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Header from './Header';
import {launchImageLibrary} from 'react-native-image-picker';
import ContactImage from './ContactImage';
import FlashTextButton from './FlashTextButton';
import NavigationWarningWrapper from './NavigationWarningWrapper';

import { getContactById, editContact, getContactByName, getContactsByKey, createContact } from '../realm/contactRealm';
import { largeImageContainerStyle } from '../assets/styles';
import Crypto from '../nativeWrapper/Crypto';

import { updateContact, addContact } from '../redux/actions/contactActions';
import { updateContactAndReferences } from '../redux/actions/combinedActions';

import { palette } from '../assets/palette';
import { useScreenAdjustedSize } from '../helper';

const EditContact = ({ route, navigation }) => {
  const dispatch = useDispatch();
  const originalContact = useSelector(state => state.contactReducer.contacts.find(contact => contact._id === route?.params?.id));
  const customStyle = useSelector(state => state.chatReducer.styles);
  const [name, _setName] = useState(originalContact?.name || "");
  const [publicKey, _setPublicKey] = useState(originalContact?.key || "");
  const [contactImage, _setContactImage] = useState(originalContact?.image || "");
  const [editingExistingContact,_setEditingExistingContact] = useState(route?.params?.id?.length > 0);
  const [errors, setErrors] = useState([]);
  const [haveSavedContact, _setHaveSavedContact] = useState(false);
  const [saving, setSaving] = useState(false);

  const nameRef = useRef(originalContact?.name || "");
  const keyRef = useRef(originalContact?.key || "");
  const imageRef = useRef(originalContact?.image || "");
  const editingExistingContactRef = useRef(route?.params?.id?.length > 0);
  const originalContactRef = useRef(originalContact || {});
  const haveSavedContactRef = useRef(false);

  const contactImageSize = useScreenAdjustedSize(0.4,0.25);

  //refs for accessing state in event listeners, used to prevent discarding unsaved changes
  const setPublicKey = data => {
    keyRef.current = data;
    _setPublicKey(data);
  }
  const setName = data => {
    nameRef.current = data;
    _setName(data);
  }
  const setContactImage = data => {
    imageRef.current = data;
    _setContactImage(data);
  }
  const setEditingExistingContact = data => {
    editingExistingContactRef.current = data;
    _setEditingExistingContact(data);
  }

  const setHaveSavedContact = data => {
    haveSavedContactRef.current = data;
    _setHaveSavedContact(data);
  }

  const scrollViewRef = useRef();

  useEffect(() => {
    originalContactRef.current = originalContact
  },[originalContact])

  useEffect(() => {
    if(!editingExistingContact) {
      setContactImage("")
      setPublicKey(route?.params?.publicKey || "");
      setName(route?.params?.name || "");
    }
  },[])

  const save = async () => {
    setSaving(true);
    let errorSaving = []
    try {
      const encryptedTest = await Crypto.encryptString(
        publicKey.trim(),
        false,
        Crypto.algorithm.RSA,
        Crypto.blockMode.ECB,
        Crypto.padding.OAEP_SHA256_MGF1Padding,
        "test"
      )
    }
    catch(e) {
      errorSaving.push({
        type : "invalid_key",
        message : "Invalid Public Key"
      })
    }

    if(name.trim().length === 0) {
      errorSaving.push({
        type : "empty_fields",
        message : "Username can not be empty"
      });
    }

    const keyExists = getContactsByKey([publicKey.trim()]);
    const nameExists = getContactByName(name.trim());

    if(keyExists != "" && keyExists[0].key != originalContact?.key) {
      errorSaving.push({
        type : "key_exists",
        message : "A user with this key already exists"
      });
    }
    if(nameExists && nameExists.name != originalContact?.name) {
      errorSaving.push({
        type : "name_exists",
        message : "A user with this name already exists"
      });
    }

    if(errorSaving.length > 0) {
      setErrors(errorSaving);
      scrollViewRef.current.scrollTo({
        y: 0,
        animated: true,
      });
      setSaving(false);
      return false;
    }

    setErrors([]);
    const newInfo = {name : name.trim(), key : publicKey.trim(), image : contactImage};
    if(editingExistingContact) {
      await editContact(route.params.id, newInfo);
      dispatch(updateContactAndReferences({...newInfo,_id : route.params.id}));
    }
    else {
      setHaveSavedContact(true);
      const createdContact = createContact(newInfo);
      dispatch(addContact(createdContact));
      navigation.navigate('main');
    }
    setSaving(false);
    return true;
  }

  const editImage = async () => {
    setErrors([]);
    const options = {
      mediaType : 'photo',
      includeBase64 : true
    }
    launchImageLibrary(options,response => {
      if(response.errorCode) {
        setErrors([{
          type : "image_error",
          message : response.errorMessage
        }])
      }
      else if(!response.didCancel) {
        setContactImage("data:" + response.type + ";base64," + response.base64);
      }
    });
  }

  const haveUnsavedChanges = () => {
    let unsavedChanges;
    if(editingExistingContactRef.current) {
      unsavedChanges = (
        originalContactRef?.current?.name?.trim() != nameRef?.current?.trim() ||
        originalContactRef?.current?.key?.trim() != keyRef?.current?.trim() ||
        originalContactRef?.current?.image != imageRef?.current
      )
    }
    else {
      unsavedChanges = (
        (nameRef?.current?.trim()?.length > 0 ||
        keyRef?.current?.trim()?.length > 0 ||
        imageRef?.current?.trim()?.length > 0) &&
        !haveSavedContactRef.current
      )
    }
    return unsavedChanges;
  }

  return (
    <NavigationWarningWrapper
    navigation={navigation}
    checkForChanges={haveUnsavedChanges}>

      <Header title={editingExistingContact ? "Edit Contact" : "Add Contact"} allowGoBack/>
      <ScrollView
      ref={scrollViewRef}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps='handled'>

        <ContactImage
        containerStyle={largeImageContainerStyle}
        imageURI={contactImage}
        iconSize={64}
        onPress={editImage}
        size={contactImageSize}/>

        {contactImage.length > 0 &&
        <FlashTextButton
        normalText="Delete Image"
        flashText="Delete Image"
        onPress={() => setContactImage("")}/>}

        {errors.map(error => {
          return (
            <Text key={error.type} style={{...styles.error, fontSize : customStyle.uiFontSize}}>{error.message}</Text>
          )
        })}

        <View style={styles.inputContainer}>
          <View style={styles.inputContainer}>
            <Text style={{...styles.inputTitle,fontSize : customStyle.uiFontSize}}>Name</Text>
            <TextInput
            style={{...styles.input, fontSize : customStyle.uiFontSize}}
            onChangeText={text => setName(text)}
            value={name}/>
          </View>

          <View style={{width : "100%"}}>
            <Text style={{...styles.inputTitle,fontSize : customStyle.uiFontSize}}>Public Key</Text>
            <TextInput
            multiline={editingExistingContact}
            style={{...styles.input,fontSize : customStyle.uiFontSize}}
            onChangeText={text => setPublicKey(text)}
            value={publicKey}/>
          </View>
        </View>

        <FlashTextButton
        normalText="Save"
        flashText="Saved!"
        onPress={save}
        loading={saving}
        timeout={editingExistingContact ? 500 : 0}
        disabled={
          (name.trim().length === 0 || publicKey.trim().length === 0) ||
          (name.trim() === originalContact?.name?.trim() &&
          publicKey.trim() === originalContact?.key?.trim() &&
          contactImage === originalContact?.image) ||
          saving
        }
        buttonStyle={styles.button}
        textStyle={styles.buttonText}/>
      </ScrollView>
    </NavigationWarningWrapper>
  )
}

const styles = {
  container : {
    padding : 30,
    alignItems : "flex-start"
  },
  button : {
    backgroundColor : palette.primary,
    padding : 10,
    alignSelf : "center",
    marginTop : 10,
    borderRadius : 5,
  },
  buttonText : {
    color : palette.white,
    fontWeight : "bold",
    fontFamily : "Open-Sans",
    textAlign : "center"
  },
  input : {
    borderColor: palette.gray,
    borderWidth: 1,
    marginBottom : 10,
    width : "100%",
    alignSelf : "center",
    padding : 10,
    backgroundColor : palette.white,
    borderRadius : 5
  },
  inputContainer : {
    width : "100%"
  },
  inputTitle : {
    fontWeight : "bold",
    marginBottom : 5
  },
  error : {
    color : palette.red,
    fontWeight : "bold",
    alignSelf : "center"
  }
}

export default EditContact;
