import React, { useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ScrollView, Alert } from 'react-native';

import { createNewPassword, getPasswordHash, updatePassword, deletePassword } from '../realm/passwordRealm';

import { setPassword } from '../redux/actions/userActions';

import Header from './Header';
import PasswordCreationBox from './PasswordCreationBox';

import Crypto from '../nativeWrapper/Crypto';
import NavigationWarningWrapper from './NavigationWarningWrapper';

const PasswordSettings = () => {
  const dispatch = useDispatch();
  const [loginPasswordErrors, setLoginPasswordErrors] = useState([]);
  const [erasurePasswordErrors, setErasurePasswordErrors] = useState([]);

  const loginPasswordHasChangesRef = useRef(false);
  const erasurePasswordHasChangesRef = useRef(false);

  const loginPasswordHash = useSelector(state => state.userReducer.loginPasswordHash);
  const erasurePasswordHash = useSelector(state => state.userReducer.erasurePasswordHash);

  const hasLoginPassword = loginPasswordHash?.length > 0;
  const hasErasurePassword = erasurePasswordHash?.length > 0;

  const checkValidPassword = (password, confirmation) => {
    const whitespace = /\s/;
    let errors = [];
    if(password.trim() === "" || confirmation.trim() === "") {
      errors.push({type : "empty_field", text : "Fields cannot be empty"})
    }
    if(whitespace.test(password) || whitespace.test(confirmation)) {
      errors.push({type : "contains_spaces", text : "Passwords cannot contain spaces"})
    }
    if(password !== confirmation) {
      errors.push({type : "dont_match", text : "Passwords do not match"})
    }
    return errors;
  }

  const savePassword = async (name, password, confirmation, setErrors) => {
    const validationErrors = checkValidPassword(password,confirmation);
    if(validationErrors.length > 0) {
      setErrors(validationErrors);
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
    }

    const loginAndErasureAreIdentical = await Crypto.compareHashes(hash,oppositeHash);

    if(loginAndErasureAreIdentical) {
      setErrors([{type : "login_erasure_match", text : "Login and Erasure password cannot be the same"}]);
      return false;
    }

    if(!hasLoginPassword && name === "erasurePassword") {
      setErasurePasswordErrors([{
        type : "eraure_before_login",
        text : "You must set up a normal password before an erasure password can be used"}
      ])
      return false;
    }

    //reset error after validation so that error text does not "flash" when re-submitting after error
    setErrors([]);

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
    <NavigationWarningWrapper checkForChanges={() => {
      return loginPasswordHasChangesRef.current || erasurePasswordHasChangesRef.current
    }}>
      <Header title="Password Settings" allowGoBack/>

      <ScrollView contentContainerStyle={styles.container}>

        <PasswordCreationBox
        primaryName="Main Password"
        secondaryName="Confirm Main Password"
        originalValue={loginPasswordHash}
        changesAreAvailable={hasChanges => {loginPasswordHasChangesRef.current = hasChanges}}
        description={mainPasswordDescription}
        errors={loginPasswordErrors}
        primaryButtonOnPress={(loginPassword,confirmLoginPassword) => savePassword(
          "loginPassword",
          loginPassword,
          confirmLoginPassword,
          setLoginPasswordErrors
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
        originalValue={erasurePasswordHash}
        changesAreAvailable={hasChanges => {erasurePasswordHasChangesRef.current = hasChanges}}
        description={erasurePasswordDescription}
        errors={erasurePasswordErrors}
        primaryButtonOnPress={(erasurePassword,confirmErasurePassword) => savePassword(
          "erasurePassword",
          erasurePassword,
          confirmErasurePassword,
          setErasurePasswordErrors
        )}
        primaryButtonText="Save"
        primaryButtonFlashText="Saved!"
        secondaryButtonOnPress={() => resetPassword("erasurePassword")}
        secondaryButtonDisabled={!hasErasurePassword}
        secondaryButtonText="Reset"
        secondaryButtonFlashText="Reset"
        />

      </ScrollView>
    </NavigationWarningWrapper>
  )
}

const styles = {
  container : {
    padding : 20,
    alignItems : "center",
  }
}

export default PasswordSettings;
