import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { View, Text, TextInput, Dimensions } from 'react-native';
import { CommonActions } from '@react-navigation/native';

import CustomButton from './CustomButton';
import { getPasswordHash } from '../realm/passwordRealm';
import { deleteAllMessages } from '../realm/chatRealm';
import { deleteAllContacts } from '../realm/contactRealm';

import Crypto from '../nativeWrapper/Crypto';

import { setPublicKey } from '../redux/actions/userActions';
import { setLocked } from '../redux/actions/appStateActions';
import { eraseState } from '../redux/actions/combinedActions';

const PasswordLockScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const loginHash = useSelector(state => state.userReducer.loginPasswordHash);
  const erasureHash = useSelector(state => state.userReducer.erasurePasswordHash);

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const checkPassword = async () => {
    setError("");
    const passwordHash = await Crypto.createHash(password);
    const isLoginPassword = await Crypto.compareHashes(passwordHash,loginHash);
    const isErasurePassword = await Crypto.compareHashes(passwordHash,erasureHash);

    if(isErasurePassword) {
      deleteAllMessages();
      deleteAllContacts();
      await Crypto.generateRSAKeyPair('herdPersonal');
      const key = await Crypto.loadKeyFromKeystore("herdPersonal");
      dispatch(setPublicKey(key));
      eraseState(dispatch)
    }

    if(isErasurePassword || isLoginPassword) {
      dispatch(setLocked(false));
      if(route?.params?.navigationTarget === "passwordSettings") {
        if(isLoginPassword || isErasurePassword) {
          navigation.dispatch(
            CommonActions.reset({
              index: 1,
              routes: [
                { name: 'main', params : {initialRoute : "settings"}},
                { name: 'passwordSettings'}
              ]
            })
          )
        }
      }
    }
    else {
      setError("Incorrect Password")
    }
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
