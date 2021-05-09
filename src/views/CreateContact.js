import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Dimensions, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Crypto from '../nativeWrapper/Crypto';
import Header from './Header';
import Icon from 'react-native-vector-icons/MaterialIcons'
import {launchImageLibrary} from 'react-native-image-picker';

const CreateContact = ({ navigation, route}) => {
  const [username, setUsername] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [error, setError] = useState("");
  const [contactImage, setContactImage] = useState("");

  useEffect(() => {
    route?.params?.publicKey && setPublicKey(route.params.publicKey);
  },[])

  const createContact = async () => {
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

      var contacts = JSON.parse(await AsyncStorage.getItem("contacts"));
      //create empty contacts array and load it back
      if(!contacts) {
        await AsyncStorage.setItem("contacts",JSON.stringify([]));
        contacts = JSON.parse(await AsyncStorage.getItem("contacts"));
      }

      //create new user if the username isnt taken
      if(!(contacts.find(user => user.name === username))) {
        await AsyncStorage.setItem("contacts",JSON.stringify([...contacts,{
          name : username.trim(),
          key : publicKey.trim(),
          image : contactImage
        }]))
        navigation.navigate("main");
      }
      else {
        setError("You Already have a contact with that username")
      }
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
        console.log("data:" + response.type + ";base64," + response.base64)
        setContactImage("data:" + response.type + ";base64," + response.base64);
      }
    });
  }

  return (
    <View>
      <Header title="Create Contact" allowGoBack/>

      <View style={{padding : 20}}>
        <Text style={styles.error}>{error}</Text>

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

        <TextInput
        placeholder="Name"
        onChangeText={name => setUsername(name)}
        defaultValue={""}
        style={styles.input}/>

        <TextInput
        placeholder="Public Key"
        onChangeText={key => setPublicKey(key)}
        style={styles.input}
        editable={!route?.params?.publicKey}
        value={publicKey}/>

        <TouchableOpacity
        style={styles.button}
        onPress={() => createContact()}>
          <Text style={styles.buttonText}>Import</Text>
        </TouchableOpacity>

      </View>
  </View>
  )
}

const styles = {
  input : {
    backgroundColor : "white",
    padding : 10,
    marginBottom : 10
  },
  button : {
    backgroundColor : "#E86252",
    padding : 10,
    alignSelf : "center",
    marginTop : 10,
    borderRadius : 5
  },
  buttonText : {
    color : "white"
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
  image : {
    width : Dimensions.get("window").width * 0.4,
    height : Dimensions.get("window").width * 0.4,
  }
}

export default CreateContact;
