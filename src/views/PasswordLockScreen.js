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
import { eraseState } from '../redux/actions/combinedActions';

import { palette } from '../assets/palette';

const PasswordLockScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const loginHash = useSelector(state => state.userReducer.loginPasswordHash);
  const erasureHash = useSelector(state => state.userReducer.erasurePasswordHash);
  const lastRoutes = useSelector(state => state.appStateReducer.lastRoutes);
  const customStyle = useSelector(state => state.chatReducer.styles);

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const checkPassword = async () => {
    setError("");
    const passwordHash = await Crypto.createHash(password);
    const isLoginPassword = await Crypto.compareHashes(passwordHash,loginHash);
    const isErasurePassword = await Crypto.compareHashes(passwordHash,erasureHash);

    if(!isLoginPassword && !isErasurePassword) {
      setError("Incorrect Password");
      return;
    }
    else {
      if(route?.params?.navigationTarget === "passwordSettings") {
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
      else {

        let routesToResetTo = [{ name : "main"}];
        if(lastRoutes.length > 0 && !isErasurePassword) {
          const lastLastRoute = lastRoutes[lastRoutes.length -1].name;
          if(lastLastRoute !== "passwordLockScreen") {
            routesToResetTo = lastRoutes;
          }
        }

        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: routesToResetTo
          })
        )

        if(isErasurePassword) {
          deleteAllMessages();
          deleteAllContacts();
          await Crypto.generateRSAKeyPair('herdPersonal');
          const key = await Crypto.loadKeyFromKeystore("herdPersonal");
          dispatch(setPublicKey(key));
          dispatch(eraseState());
        }
      }
    }

  }

  return (
    <View style={styles.container}>
      <Text style={{...styles.error, fontSize : customStyle.uiFontSize}}>{error}</Text>
      <Text style={{...styles.inputTitle, fontSize : customStyle.uiFontSize}}>Enter Your Password : </Text>

      <TextInput
      secureTextEntry
      style={{...styles.input, fontSize : customStyle.uiFontSize}}
      onChangeText={setPassword}
      value={password}/>

      <CustomButton
      text="Submit"
      buttonStyle={{backgroundColor : palette.offprimary,elevation : 2}}
      disabled={password.length == 0}
      onPress={checkPassword}/>
    </View>
  )
}

const styles = {
  container : {
    alignItems : "center",
    justifyContent : "center",
    backgroundColor : palette.primary,
    flex : 1
  },
  input : {
    borderColor: palette.grey,
    borderWidth: 1,
    marginBottom : 10,
    width : Dimensions.get('window').width * 0.9,
    alignSelf : "center",
    padding : 10,
    backgroundColor : palette.white,
    borderRadius : 5
  },
  inputTitle : {
    fontWeight : "bold",
    marginBottom : 5,
    color : palette.white
  },
  error : {
    fontWeight : "bold",
    color : palette.red
  }
}

export default PasswordLockScreen;
