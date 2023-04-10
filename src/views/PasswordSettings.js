import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { View, ScrollView, Text, TextInput, Dimensions, Alert } from 'react-native';

import { createNewPassword, getPasswordHash, updatePassword, deletePassword } from '../realm/passwordRealm';

import { setPassword } from '../redux/actions/userActions';

import Header from './Header';
import FlashTextButton from './FlashTextButton';
import PasswordCreationBox from './PasswordCreationBox';

import Crypto from '../nativeWrapper/Crypto';

const PasswordSettings = () => {
  const dispatch = useDispatch();
  const [loginPasswordError, setLoginPasswordError] = useState("");
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
    const validate = checkValidPassword(password,confirmation);
    if(!validate.valid) {
      setError(validate.error);
      return false;
    }
    const hash = await Crypto.createHash(password);
    const loginHash = getPasswordHash("loginPassword");
    const erasureHash = getPasswordHash("erasurePassword");

    let originalHash = "";
    let oppositeHash = "";
    let shortName = "";
    if (name === "loginPassword") {
      originalHash = loginHash;
      oppositeHash = erasureHash
      shortName = "login";
    }
    else if(name === "erasurePassword") {
      originalHash = erasureHash;
      oppositeHash = loginHash;
      shortName = "erasure"
    }
    else {
      throw new error("invalid password name used when attempting to save password");
      return;
    }

    const loginAndErasureAreIdentical = await Crypto.compareHashes(hash,oppositeHash);

    if(loginAndErasureAreIdentical) {
      setError("Login and Erasure password cannot be the same");
      return false;
    }

    if(!hasLoginPassword && name === "erasurePassword") {
      setErasurePasswordError("You must set up a normal password before an erasure password can be used")
      return false;
    }

    //reset error after validation so that error text does not "flash" when re-submitting after error
    setError("");

    if(originalHash.length > 0) {
      updatePassword(name,hash);
    }
    else {
      createNewPassword(name,hash);
    }
    dispatch(setPassword(shortName,hash));
    
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

  const mainPasswordDescription = `You will be asked to enter this password when opening the app \
and accessing security-critical pages such as this one.`

  const erasurePasswordDescription = `Entering this password when opening the app will cause all data \
to be wiped from the application. Your public key will also be changed, \
meaning all contacts who have previously added you will need to add you again.`

  return (
    <>
      <Header title="Password Settings" allowGoBack/>

      <ScrollView contentContainerStyle={styles.container}>

        <PasswordCreationBox
        primaryName="Main Password"
        secondaryName="Confirm Main Password"
        description={mainPasswordDescription}
        error={loginPasswordError}
        primaryButtonOnPress={(loginPassword,confirmLoginPassword) => savePassword(
          "loginPassword",
          loginPassword,
          confirmLoginPassword,
          setLoginPasswordError
        )}
        primaryButtonText="Save"
        primaryButtonFlashText="Saved!"
        secondaryButtonOnPress={() => resetPassword("loginPassword")}
        secondaryButtonDisabled={!hasLoginPassword}
        secondaryButtonText="Reset"
        secondaryButtonFlashText="Reset"
        />

        <PasswordCreationBox
        mainContainerStyle={{marginTop : 10}}
        primaryName="Erasure Password"
        secondaryName="Confirm Erasure Password"
        description={erasurePasswordDescription}
        error={erasurePasswordError}
        primaryButtonOnPress={(erasurePassword,confirmErasurePassword) => savePassword(
          "erasurePassword",
          erasurePassword,
          confirmErasurePassword,
          setErasurePasswordError
        )}
        primaryButtonText="Save"
        primaryButtonFlashText="Saved!"
        secondaryButtonOnPress={() => resetPassword("erasurePassword")}
        secondaryButtonDisabled={!hasErasurePassword}
        secondaryButtonText="Reset"
        secondaryButtonFlashText="Reset"
        />

      </ScrollView>
    </>
  )
}

const styles = {
  container : {
    padding : 20,
    alignItems : "center",
  }
}

export default PasswordSettings;
