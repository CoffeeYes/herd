import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Text, TextInput, Dimensions, View } from 'react-native';
import { CommonActions, useIsFocused } from '@react-navigation/native';

import CustomButton from './CustomButton';
import FullScreenSplash from './FullScreenSplash';
import { deleteAllMessages } from '../realm/chatRealm';
import { deleteAllContacts } from '../realm/contactRealm';

import Crypto from '../nativeWrapper/Crypto';

import { setPublicKey } from '../redux/actions/userActions';
import { eraseState } from '../redux/actions/combinedActions';

import { palette } from '../assets/palette';
import { useOrientationBasedStyle } from '../helper';

const PasswordLockScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const loginHash = useSelector(state => state.userReducer.loginPasswordHash);
  const erasureHash = useSelector(state => state.userReducer.erasurePasswordHash);
  const lastRoutes = useSelector(state => state.appStateReducer.lastRoutes);
  const customStyle = useSelector(state => state.chatReducer.styles);

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const inputWidth = useOrientationBasedStyle({width : "90%"},{width : "80%"});

  const isFocused = useIsFocused();

  useEffect(() => { 
    const beforeGoingBack = navigation.addListener("beforeRemove", e => {
      if(e.data.action.type == "GO_BACK" && route?.params?.navigationTarget !== "passwordSettings") {
        e.preventDefault();
      }
    })

    return beforeGoingBack;
  },[])

  const checkPassword = async () => {
    setError("");
    if(password.trim().length !== password.length) {
      return setError("Your password cannot include leading or trailing spaces.")
    }
    const passwordHash = await Crypto.createHash(password);
    const isLoginPassword = await Crypto.compareHashes(passwordHash,loginHash);
    const isErasurePassword = await Crypto.compareHashes(passwordHash,erasureHash);

    if(!isLoginPassword && !isErasurePassword) {
      setError("Incorrect Password");
      return;
    }
    else {
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
    <FullScreenSplash containerStyle={styles.container}>
      <Text style={{...styles.error, fontSize : customStyle.scaledUIFontSize}}>{error}</Text>
      <Text style={{...styles.inputTitle, fontSize : customStyle.scaledUIFontSize}}>Enter Your Password : </Text>

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
