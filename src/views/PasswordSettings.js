import React, { useState } from 'react';
import { View, Text, TextInput, Dimensions } from 'react-native';

import Header from './Header';
import FlashTextButton from './FlashTextButton'

const PasswordSettings = () => {
  const [loginPassword, setLoginPassword] = useState("");
  const [erasurePassword, setErasurePassword] = useState("");

  const save = () => {
    
  }

  return (
    <>
      <Header title="Password Settings" allowGoBack/>

      <View style={styles.container}>

        <Text style={styles.inputTitle}>Main Password</Text>
        <TextInput
        style={styles.input}
        onChangeText={setLoginPassword}
        value={loginPassword}/>

        <Text style={styles.inputTitle}>Erasure Password</Text>
        <TextInput
        style={styles.input}
        onChangeText={setErasurePassword}
        value={erasurePassword}/>

        <FlashTextButton
        normalText="Save"
        flashText="Saved!"
        onPress={save}
        timeout={500}
        buttonStyle={styles.button}
        textStyle={styles.buttonText}/>

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
}

export default PasswordSettings;
