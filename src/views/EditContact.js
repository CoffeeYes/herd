import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { View, TextInput, Text, ScrollView } from 'react-native';
import Header from './Header';
import {launchImageLibrary} from 'react-native-image-picker';
import ContactImage from './ContactImage';
import CloseButton from './CloseButton';
import NavigationWarningWrapper from './NavigationWarningWrapper';

import Crypto from '../nativeWrapper/Crypto';

import { editContact, getContactsByKey, createContact } from '../realm/contactRealm';
import { largeImageContainerStyle } from '../assets/styles';

import { addContact } from '../redux/actions/contactActions';
import { updateContactAndReferences } from '../redux/actions/combinedActions';

import { palette } from '../assets/palette';
import { useScreenAdjustedSize } from '../helper';
import { encryptStrings } from '../common';
import LoadingIndicator from './LoadingIndicator';

const EditContact = ({ route, navigation }) => {
  const dispatch = useDispatch();
  const originalContact = useSelector(state => state.contactReducer.contacts.find(contact => contact._id === route?.params?.id));
  const customStyle = useSelector(state => state.chatReducer.styles);
  const ownPublicKey = useSelector(state => state.userReducer.publicKey);
  const [errors, setErrors] = useState([]);
  const [saving, setSaving] = useState(false);
  const [headerIcon, setHeaderIcon] = useState("save");
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  const editingExistingContact = route?.params?.id?.length > 0;

  const contactImageSize = useScreenAdjustedSize(0.4,0.25);

  const [name, setName] = useState(originalContact?.name || "");
  const [publicKey, setPublicKey] = useState(originalContact?.key || "");
  const [contactImage, setContactImage] = useState(originalContact?.image || "");

  const publicKeyInputRef = useRef();
  const scrollViewRef = useRef();

  const unsavedChangesRef = useRef(false);

  useEffect(() => {
    if(!editingExistingContact) {
      route?.params?.publicKey &&
      setPublicKey(route.params.publicKey);

      route?.params?.name &&
      setName(route.params.name);
    }

    return () => {
      Crypto.cancelCoroutineWork();
    }
  },[])

  const save = async () => {
    setSaving(true);
    let errorSaving = []
    if(name.trim().length === 0) {
      errorSaving.push({
        type : "empty_name",
        message : "Username can not be empty"
      });
    }

    if(publicKey.trim().length === 0) {
      errorSaving.push({
        type : "empty_key",
        message : "Key field can not be empty"
      })
    }
    else if(publicKey.trim() === ownPublicKey.trim()) {
      errorSaving.push({
        type : "invalid_key",
        message : "You can not add your own key"
      })
    }
    else {
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
    }

    const existingContactWithKey = getContactsByKey([publicKey.trim()])[0];

    if(existingContactWithKey && existingContactWithKey.key != originalContact?.key) {
      errorSaving.push({
        type : "key_exists",
        message : "A user with this key already exists"
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

      setHeaderIcon("check");
      setTimeout(() => {
        setHeaderIcon("save");
      },500)
    }
    else {
      const createdContact = createContact(newInfo);
      dispatch(addContact(createdContact));
      navigation.navigate('main');
    }
    setSaving(false);
    return true;
  }

  const handleImageResponse = response => {
    if(response.errorCode) {
      setErrors([{
        type : "image_error",
        message : response.errorMessage
      }])
    }
    else if(!response.didCancel) {
      const {base64, type} = response?.assets?.[0];
      if(base64 && type){
        setContactImage("data:" + type + ";base64," + base64);
      }
    }
  }

  const editImage = async () => {
    setErrors([]);
    const options = {
      mediaType : 'photo',
      includeBase64 : true
    }
    const response = await launchImageLibrary(options);
    handleImageResponse(response)
  }

  useEffect(() => {
    const unsavedChanges = editingExistingContact ? (
      originalContact.name.trim() != name.trim() ||
      originalContact.key.trim() != publicKey.trim() ||
      originalContact.image != contactImage
    ) 
    :
    (
      name.trim().length > 0 ||
      publicKey.trim().length > 0 ||
      contactImage.trim().length > 0
    )
    setUnsavedChanges(unsavedChanges);
    unsavedChangesRef.current = unsavedChanges;
  },[contactImage,name,publicKey,originalContact])

  const hideSaveButton = () => {
    return (
      !unsavedChanges &&
      headerIcon !== "check" ||
      publicKey.trim().length == 0 ||
      name.trim().length == 0
    )
  }

  return (
    <NavigationWarningWrapper
    checkForChanges={() => unsavedChangesRef.current}>

      <Header
      title={editingExistingContact ? "Edit Contact" : "Add Contact"}
      allowGoBack
      rightButtonIcon={!hideSaveButton() && headerIcon}
      useAlternativeIcon={saving}
      alternativeIcon={<LoadingIndicator/>}
      rightButtonOnClick={save}/>

      <ScrollView
      ref={scrollViewRef}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps='handled'>
        
        <View style={styles.imageContainer}>

          <ContactImage
          containerStyle={largeImageContainerStyle}
          imageURI={contactImage}
          iconSize={64}
          onPress={editImage}
          size={contactImageSize}/>

          {contactImage.length > 0 &&
          <CloseButton onPress={() => setContactImage("")}/>}

        </View>

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
            onSubmitEditing={() => {
              if(publicKey.length == 0 && name.trim().length != 0) {
                publicKeyInputRef.current.focus()
              }
              else if(!hideSaveButton()) {
                save();
              }
            }}
            value={name}/>
          </View>

          <View style={{width : "100%"}}>
            <Text style={{...styles.inputTitle,fontSize : customStyle.scaledUIFontSize}}>Public Key</Text>
            <TextInput
            ref={publicKeyInputRef}
            multiline={editingExistingContact}
            blurOnSubmit
            style={{...styles.input,fontSize : customStyle.scaledUIFontSize}}
            onChangeText={text => setPublicKey(text)}
            onSubmitEditing={() => !hideSaveButton() && save()}
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
  },
  imageContainer : {
    alignSelf : "center",
    flexDirection : "row"
  }
}

export default EditContact;
