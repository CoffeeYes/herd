import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Dimensions } from 'react-native';
import CustomButton from './CustomButton';

import { getPasswordHash } from '../realm/passwordRealm';

import Crypto from '../nativeWrapper/Crypto';


const PasswordLockScreen = ({ navigation, route }) => {
  const [password, setPassword] = useState("");
  const [savedHash, setSavedHash] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const hash = getPasswordHash("loginPassword");
    setSavedHash(hash);
  },[])

  const checkPassword = async () => {
    setError("");
    //determine if password is correct, and navigate to route.params.navigationTarget if so
    const passwordHash = await Crypto.createHash(password);
    const correct = await Crypto.compareHashes(passwordHash,savedHash);
    return correct ? navigation.navigate(route.params.navigationTarget) : setError("Incorrect Password");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.error}>{error}</Text>
      <Text style={styles.inputTitle}>Enter Your Password : </Text>
      <TextInput
      secureTextEntry
      style={styles.input}
      onChangeText={setPassword}
      value={password}/>
      <CustomButton
      text="Submit"
      onPress={checkPassword}/>
    </View>
  )
}

const styles = {
  container : {
    alignItems : "center",
    justifyContent : "center",
    backgroundColor : "#e05e3f",
    flex : 1
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
    marginBottom : 5,
    color : "white"
  },
  error : {
    fontWeight : "bold",
    color : "red"
  }
}

export default PasswordLockScreen;
