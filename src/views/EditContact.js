import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { View, TextInput, Text, 
         ActivityIndicator, ScrollView } from 'react-native';
import Header from './Header';
import {launchImageLibrary} from 'react-native-image-picker';
import ContactImage from './ContactImage';
import FlashTextButton from './FlashTextButton';
import NavigationWarningWrapper from './NavigationWarningWrapper';

import Crypto from '../nativeWrapper/Crypto';

import { editContact, getContactByName, getContactsByKey, createContact } from '../realm/contactRealm';
import { largeImageContainerStyle } from '../assets/styles';

import { addContact } from '../redux/actions/contactActions';
import { updateContactAndReferences } from '../redux/actions/combinedActions';

import { palette } from '../assets/palette';
import { useScreenAdjustedSize, useStateAndRef } from '../helper';
import { encryptStrings } from '../common';

const EditContact = ({ route, navigation }) => {
  const dispatch = useDispatch();
  const originalContact = useSelector(state => state.contactReducer.contacts.find(contact => contact._id === route?.params?.id));
  const customStyle = useSelector(state => state.chatReducer.styles);
  const [errors, setErrors] = useState([]);
  const [saving, setSaving] = useState(false);
  const [headerIcon, setHeaderIcon] = useState("save");

  const originalContactRef = useRef(originalContact || {});
  const haveSavedContactRef = useRef(false);
  const editingExistingContact = route?.params?.id?.length > 0;

  const contactImageSize = useScreenAdjustedSize(0.4,0.25);

  const [name, setName, nameRef] = useStateAndRef(originalContact?.name || "");
  const [publicKey, setPublicKey, keyRef] = useStateAndRef(originalContact?.key || "");
  const [contactImage, setContactImage, imageRef] = useStateAndRef(originalContact?.image || "");

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

    return () => {
      Crypto.cancelCoroutineWork();
    }
  },[])

  const save = async () => {
    setSaving(true);
    let errorSaving = []
    try {
      await encryptStrings(
        publicKey.trim(),
        false,
        ["test"]
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
    let newInfo = {name : name.trim(), key : publicKey.trim(), image : contactImage, ...(route?.params?.id && {_id : route.params.id})};
    if(editingExistingContact) {
      const messagesUpdated = await editContact(newInfo);
      if(!messagesUpdated) {
        delete newInfo.key;
      }
      dispatch(updateContactAndReferences(newInfo));
    }
    else {
      haveSavedContactRef.current = true;
      const createdContact = createContact(newInfo);
      dispatch(addContact(createdContact));
      navigation.navigate('main');
    }
    if(editingExistingContact) {
      setHeaderIcon("check");
      setTimeout(() => {
        setHeaderIcon("save");
      },500)
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
    if(editingExistingContact) {
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

  const hideSaveButton = () => {
    return (
      (name.trim().length === 0 || publicKey.trim().length === 0) ||
      (name.trim() === originalContact?.name?.trim() &&
      publicKey.trim() === originalContact?.key?.trim() &&
      headerIcon !== "check" &&
      contactImage === originalContact?.image)
    )
  }

  return (
    <NavigationWarningWrapper
    checkForChanges={haveUnsavedChanges}>

      <Header
      title={editingExistingContact ? "Edit Contact" : "Add Contact"}
      allowGoBack
      rightButtonIcon={!hideSaveButton() && headerIcon}
      useAlternativeIcon={saving}
      alternativeIcon={<ActivityIndicator size="large" color={palette.primary}/>}
      rightButtonOnClick={save}/>

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
            <Text key={error.type} style={{...styles.error, fontSize : customStyle.scaledUIFontSize}}>{error.message}</Text>
          )
        })}

        <View style={styles.inputContainer}>
          <View style={styles.inputContainer}>
            <Text style={{...styles.inputTitle,fontSize : customStyle.scaledUIFontSize}}>Name</Text>
            <TextInput
            style={{...styles.input, fontSize : customStyle.scaledUIFontSize}}
            onChangeText={text => setName(text)}
            value={name}/>
          </View>

          <View style={{width : "100%"}}>
            <Text style={{...styles.inputTitle,fontSize : customStyle.scaledUIFontSize}}>Public Key</Text>
            <TextInput
            multiline={editingExistingContact}
            style={{...styles.input,fontSize : customStyle.scaledUIFontSize}}
            onChangeText={text => setPublicKey(text)}
            value={publicKey}/>
          </View>
        </View>
      </ScrollView>
    </NavigationWarningWrapper>
  )
}

const styles = {
  container : {
    padding : 30,
    alignItems : "flex-start"
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
