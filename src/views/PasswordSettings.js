import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { View, ScrollView, Text, TextInput, Dimensions, Alert } from 'react-native';

import { createNewPassword, getPasswordHash, updatePassword, deletePassword } from '../realm/passwordRealm';

import { setPassword } from '../redux/actions/userActions';
import { setLocked } from '../redux/actions/appStateActions';

import Header from './Header';
import FlashTextButton from './FlashTextButton';

import Crypto from '../nativeWrapper/Crypto';

const PasswordSettings = () => {
  const dispatch = useDispatch();
  const [loginPassword, setLoginPassword] = useState("");
  const [confirmLoginPassword, setConfirmLoginPassword] = useState("");
  const [loginPasswordError, setLoginPasswordError] = useState("");
  const [erasurePassword, setErasurePassword] = useState("");
  const [confirmErasurePassword, setConfirmErasurePassword] = useState("");
  const [erasurePasswordError, setErasurePasswordError] = useState("");

  const hasErasurePassword = useSelector(state => state.userReducer.erasurePasswordHash)?.length > 0;
  const hasLoginPassword = useSelector(state => state.userReducer.loginPasswordHash)?.length > 0;

  const checkValidPassword = (password, confirmation) => {
    const whitespace = /\s/;
    if(password.trim() === "" || confirmation.trim() === "") {
      return {valid : false, error : "Fields cannot be empty"}
    }
    if(whitespace.test(password) || whitespace.test(confirmation)) {
      return {valid : false, error : "Passwords cannot contain spaces"}
    }
    if(password !== confirmation) {
      return {valid : false, error : "Passwords do not match"};
    }
    return {valid : true};
  }

  const savePassword = async (name, password, confirmation, setError) => {
    setError("");
    const validate = checkValidPassword(password,confirmation);
    if(!validate.valid) {
      setError(validate.error);
      return false;
    }
    const hash = await Crypto.createHash(password);
    const loginHash = getPasswordHash("loginPassword");
    const erasureHash = getPasswordHash("erasurePassword");

    if(loginHash.length > 0 && erasureHash.length > 0  &&
     name === "loginPassword" && await Crypto.compareHashes(hash,erasureHash) ||
     name === "erasurePassword" && await Crypto.compareHashes(hash,loginHash)) {
      setError("Login and Erasure password cannot be the same");
      return false;
    }

    if(!hasLoginPassword && name === "erasurePassword") {
      setErasurePasswordError("You must set up a normal password before an erasure password can be used")
      return  false;
    }

    if(name === "loginPassword") {
      if(loginHash) {
        updatePassword(name,hash);
      }
      else {
        createNewPassword(name,hash);
      }
      //update state store
      dispatch(setPassword("login",hash));
      //reset form
      setLoginPassword("");
      setConfirmLoginPassword("");
    }
    else if(name === "erasurePassword") {
      if(erasureHash) {
        updatePassword(name,hash);
      }
      else {
        createNewPassword(name,hash);
      }
      dispatch(setPassword("erasure",hash));
      setErasurePassword("");
      setConfirmErasurePassword("");
    }
    return true;
  }

  const resetPassword = passwordName => {
    Alert.alert(
      'Are you sure you want to reset this password?',
      '',
      [
        { text: "Cancel", style: 'cancel', onPress: () => {} },
        {
          text: 'Confirm',
          style: 'destructive',
          // If the user confirmed, then we dispatch the action we blocked earlier
          // This will continue the action that had triggered the removal of the screen
          onPress: async () => {
            deletePassword(passwordName);
            dispatch(setPassword("erasure",""));
            if(passwordName === "loginPassword") {
              deletePassword("erasurePassword");
              dispatch(setPassword("login",""));
            }
          },
        },
      ]
    );
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

          <View style={{flexDirection : "row"}}>
            <FlashTextButton
            normalText="Save"
            flashText="Saved!"
            disabled={loginPassword.trim().length === 0 || confirmLoginPassword.trim().length === 0}
            onPress={() => savePassword(
              "loginPassword",
              loginPassword,
              confirmLoginPassword,
              setLoginPasswordError
            )}
            timeout={500}
            buttonStyle={styles.button}
            textStyle={styles.buttonText}/>

            <FlashTextButton
            normalText="Reset"
            flashText="Reset"
            disabled={!hasLoginPassword}
            onPress={() => resetPassword("loginPassword")}
            timeout={0}
            buttonStyle={{...styles.button, marginLeft : 10}}
            textStyle={styles.buttonText}/>
          </View>
        </View>

        <View style={{...styles.card,marginTop : 10}}>
          <Text multiline>
            Entering this password when opening the app will cause all data
            to be wiped from the application. Your public key will also be changed,
            meaning all contacts who have previously added you will need to add you again.
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

          <View style={{flexDirection : "row"}}>
            <FlashTextButton
            normalText="Save"
            flashText="Saved!"
            disabled={erasurePassword.trim().length === 0 || confirmErasurePassword.trim().length === 0}
            onPress={() => savePassword(
              "erasurePassword",
              erasurePassword,
              confirmErasurePassword,
              setErasurePasswordError
            )}
            timeout={500}
            buttonStyle={styles.button}
            textStyle={styles.buttonText}/>
            <FlashTextButton
            normalText="Reset"
            flashText="Reset"
            disabled={!hasErasurePassword}
            onPress={() => resetPassword("erasurePassword")}
            timeout={0}
            buttonStyle={{...styles.button, marginLeft : 10}}
            textStyle={styles.buttonText}/>
          </View>
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
