import React, { useState } from 'react';
import { View, ScrollView, Text, TextInput, Dimensions } from 'react-native';

import Header from './Header';
import FlashTextButton from './FlashTextButton'

const PasswordSettings = () => {
  const [loginPassword, setLoginPassword] = useState("");
  const [confirmLoginPassword, setConfirmLoginPassword] = useState("");
  const [loginPasswordError, setLoginPasswordError] = useState("");
  const [erasurePassword, setErasurePassword] = useState("");
  const [confirmErasurePassword, setConfirmErasurePassword] = useState("");
  const [erasurePasswordError, setErasurePasswordError] = useState("");

  const checkValidPassword = (password, confirmation) => {
    const whitespace = /\s/;
    if(whitespace.test(password) || whitespace.test(confirmation)) {
      return {valid : false, error : "Passwords cannot contain spaces"}
    }
    if(password !== confirmation) {
      return {valid : false, error : "Passwords do not match"};
    }
    return {valid : true};
  }

  const saveMainPassword = () => {
    setLoginPasswordError("");
    const validate = checkValidPassword(loginPassword,confirmLoginPassword);
    if(!validate.valid) {
      return setLoginPasswordError(validate.error);
    }
  }
  const saveErasurePassword = () => {
    setErasurePasswordError("");
    const validate = checkValidPassword(erasurePassword,confirmErasurePassword);
    if(!validate.valid) {
      return setErasurePasswordError(validate.error);
    }
  }

  return (
    <>
      <Header title="Password Settings" allowGoBack/>

      <ScrollView contentContainerStyle={styles.container}>

        <View style={styles.card}>
          <Text multiline>
            You will be asked to enter this password when opening the app
            and accessing security-critical pages such as this one.
          </Text>
          <Text style={styles.error}>{loginPasswordError}</Text>
          <Text style={styles.inputTitle}>Main Password</Text>
          <TextInput
          secureTextEntry
          style={styles.input}
          onChangeText={setLoginPassword}
          value={loginPassword}/>

          <Text style={styles.inputTitle}>Confirm Main Password</Text>
          <TextInput
          secureTextEntry
          style={styles.input}
          onChangeText={setConfirmLoginPassword}
          value={confirmLoginPassword}/>
          <FlashTextButton

          normalText="Save"
          flashText="Saved!"
          onPress={saveMainPassword}
          timeout={500}
          buttonStyle={styles.button}
          textStyle={styles.buttonText}/>
        </View>

        <View style={{...styles.card,marginTop : 10}}>
          <Text multiline>
            Entering this password when opening the app will cause all data
            to be wiped from the application.
          </Text>
          <Text style={styles.error}>{erasurePasswordError}</Text>
          <Text style={styles.inputTitle}>Erasure Password</Text>
          <TextInput
          secureTextEntry
          style={styles.input}
          onChangeText={setErasurePassword}
          value={erasurePassword}/>
          <Text style={styles.inputTitle}>Confirm Erasure Password</Text>
          <TextInput
          secureTextEntry
          style={styles.input}
          onChangeText={setConfirmErasurePassword}
          value={confirmErasurePassword}/>

          <FlashTextButton
          normalText="Save"
          flashText="Saved!"
          onPress={saveErasurePassword}
          timeout={500}
          buttonStyle={styles.button}
          textStyle={styles.buttonText}/>
        </View>

      </ScrollView>
    </>
  )
}

const styles = {
  container : {
    padding : 20,
    alignItems : "center",
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
    width : Dimensions.get('window').width * 0.8,
    alignSelf : "center",
    padding : 10,
    backgroundColor : "white",
    borderRadius : 5
  },
  inputTitle : {
    fontWeight : "bold",
    marginBottom : 5
  },
  card : {
    backgroundColor : "white",
    padding : 20,
    borderRadius : 5,
    alignItems : "center",
    justifyContent : "center",
    elevation : 2
  },
  error : {
    color : "red",
    fontWeight : "bold"
  }
}

export default PasswordSettings;
