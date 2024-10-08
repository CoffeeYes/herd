import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Text, TextInput, Dimensions, View, BackHandler } from 'react-native';
import { CommonActions, useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import CustomButton from './CustomButton';
import FullScreenSplash from './FullScreenSplash';
import { deleteAllMessages } from '../realm/chatRealm';
import { deleteAllContacts } from '../realm/contactRealm';

import Crypto from '../nativeWrapper/Crypto';

import { setPublicKey } from '../redux/actions/userActions';
import { eraseState } from '../redux/actions/combinedActions';

import { palette } from '../assets/palette';
import { useOrientationBasedStyle } from '../helper';
import { deletePassword } from '../realm/passwordRealm';
import { setPassword as setPasswordRedux } from '../redux/actions/userActions';
import { clear } from 'react-native/Libraries/LogBox/Data/LogBoxData';

const PasswordLockScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const loginHash = useSelector(state => state.userReducer.loginPasswordHash);
  const erasureHash = useSelector(state => state.userReducer.erasurePasswordHash);
  const lastRoutes = useSelector(state => state.appStateReducer.lastRoutes);
  const customStyle = useSelector(state => state.chatReducer.styles);
  const maxPasswordAttempts = useSelector(state => state.appStateReducer.maxPasswordAttempts);

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [passwordAttemptCount, setPasswordAttemptCount] = useState(0);

  const inputWidth = useOrientationBasedStyle({width : "90%"},{width : "80%"});

  const isFocused = useIsFocused();

  useEffect(() => { 
    (async () => {
      const passwordCount = Number(await AsyncStorage.getItem("passwordAttemptCount"));
      if(passwordCount) {
        setPasswordAttemptCount(passwordCount)
      }
      else {
        setPasswordAttemptCount(maxPasswordAttempts)
      }
    })()

    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      if(route?.params?.navigationTarget !== "passwordSettings") {
        BackHandler.exitApp();
        return true;
      }
      return false;
    })

    return () => {
      backHandler.remove();
    }
  },[])

  const eraseData = async (clearPasswords = false) => {
    deleteAllMessages();
    deleteAllContacts();
    await Crypto.generateRSAKeyPair('herdPersonal');
    const key = await Crypto.loadKeyFromKeystore("herdPersonal");
    dispatch(setPublicKey(key));
    dispatch(eraseState());
    if(clearPasswords) {
      deletePassword("login");
      deletePassword("erasure");
      dispatch(setPasswordRedux("erasure",""));
      dispatch(setPasswordRedux("login",""));
    }
  }

  const checkPassword = async () => {
    if(password.trim().length !== password.length) {
      return setError("Your password cannot include leading or trailing spaces.")
    }
    const passwordHash = await Crypto.createHash(password);
    const isLoginPassword = await Crypto.compareHashes(passwordHash,loginHash);
    const isErasurePassword = await Crypto.compareHashes(passwordHash,erasureHash);

    if(!isLoginPassword && !isErasurePassword) {
      setError("Incorrect Password");
      if(maxPasswordAttempts > 0) {
        if(passwordAttemptCount == 1) {
          eraseData(true);
          await AsyncStorage.setItem("passwordAttemptCount", maxPasswordAttempts.toString())
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{name : "main"}]
            })
          )
          return;
        }
        else {
          let newCount = passwordAttemptCount - 1;
          setPasswordAttemptCount(newCount);
          AsyncStorage.setItem("passwordAttemptCount",newCount.toString())
        }
      }
      return;
    }
    else {
      setError("");
      AsyncStorage.setItem("passwordAttemptCount",maxPasswordAttempts.toString())
      //this is used when passwordLockScreen is shown before allowing the user to navigate to passwordSettings page
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
          routesToResetTo = lastRoutes;
        }

        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: routesToResetTo
          })
        )

        if(isErasurePassword) {
          eraseData();
        }
      }
    }

  }

  return (
    <FullScreenSplash containerStyle={styles.container}>
      <Text style={{...styles.error, fontSize : customStyle.scaledUIFontSize}}>{error}</Text>
      

      <Text style={{...styles.inputTitle, fontSize : customStyle.scaledUIFontSize}}>Enter Your Password : </Text>

      {passwordAttemptCount < maxPasswordAttempts &&
      <Text style={{color : palette.white, marginBottom : 10}}>{`Remaining Attempts : ${passwordAttemptCount}`}</Text>}

      <TextInput
      secureTextEntry
      style={{...styles.input, fontSize : customStyle.scaledUIFontSize, ...inputWidth}}
      onChangeText={setPassword}
      value={password}/>

      <View style={styles.buttonContainer}>
        
        {route?.params?.navigationTarget === "passwordSettings" &&
        <CustomButton
        text="Cancel"
        style={styles.button}
        onPress={() => isFocused && navigation.goBack()}
        />}

        <CustomButton
        text="Submit"
        buttonStyle={{...styles.button, marginLeft : 10}}
        disabled={password.trim().length == 0}
        onPress={checkPassword}/>

      </View>
    </FullScreenSplash>
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
  },
  buttonContainer : {
    flexDirection : "row"
  },
  button : {
    backgroundColor : palette.offprimary, 
    elevation : 2
  }
}

export default PasswordLockScreen;
