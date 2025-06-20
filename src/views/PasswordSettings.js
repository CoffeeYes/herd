import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ScrollView, TextInput, Text, View } from 'react-native';
import { palette } from '../assets/palette';

import { getPasswordHash, updatePassword, deletePassword } from '../realm/passwordRealm';

import { setPassword } from '../redux/actions/userActions';

import Header from './Header';
import PasswordCreationBox from './PasswordCreationBox';
import FlashTextButton from './FlashTextButton';

import Crypto from '../nativeWrapper/Crypto';
import NavigationWarningWrapper from './NavigationWarningWrapper';
import { setMaxPasswordAttempts } from '../redux/actions/appStateActions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ConfirmationModal from './ConfirmationModal';
import { STORAGE_STRINGS } from '../common';

const PasswordSettings = () => {
  const dispatch = useDispatch();
  const [loginPasswordErrors, setLoginPasswordErrors] = useState([]);
  const [erasurePasswordErrors, setErasurePasswordErrors] = useState([]);
  const [showResetModal, setShowResetModal] = useState(false);
  const [passwordToReset, setPasswordToReset] = useState("");

  const customStyle = useSelector(state => state.appStateReducer.styles);
  const maxPasswordAttempts = useSelector(state => state.appStateReducer.maxPasswordAttempts);
  const [chosenMaxPasswordAttempts, setChosenMaxPasswordAttempts] = useState(maxPasswordAttempts.toString());

  const loginPasswordHasChangesRef = useRef(false);
  const erasurePasswordHasChangesRef = useRef(false);
  const maxPasswordAttemptsHasChangesRef = useRef(false);
  const resetPasswordPromiseRef = useRef();

  const loginPasswordHash = useSelector(state => state.userReducer.loginPasswordHash);
  const erasurePasswordHash = useSelector(state => state.userReducer.erasurePasswordHash);

  const hasLoginPassword = loginPasswordHash?.length > 0;
  const hasErasurePassword = erasurePasswordHash?.length > 0;

  useEffect(() => {
    maxPasswordAttemptsHasChangesRef.current = maxPasswordAttempts != Number(chosenMaxPasswordAttempts) && chosenMaxPasswordAttempts.length > 0;
  },[maxPasswordAttempts, chosenMaxPasswordAttempts])

  const checkValidPassword = (password, confirmation) => {
    const whitespace = /\s/;
    let errors = [];
    if(password.trim() === "" || confirmation.trim() === "") {
      errors.push({type : "empty_field", text : "Fields cannot be empty"})
      return errors;
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
    const loginHash = getPasswordHash("login");

    if(name === "erasure") {
      if(hasLoginPassword) {
        const loginAndErasureAreIdentical = await Crypto.compareHashes(loginHash,hash);

        if(loginAndErasureAreIdentical) {
          setErrors([{type : "login_erasure_match", text : "Login and Erasure password cannot be the same"}]);
          return false;
        }
      }
      else {
        setErasurePasswordErrors([{
          type : "erasure_before_login",
          text : "You must set up a normal password before an erasure password can be used"}
        ])
        return false;
      }
    }

    //reset error after validation so that error text does not "flash" when re-submitting after error
    setErrors([]);

    updatePassword(name,hash);
    dispatch(setPassword(name,hash));

    return true;
  }

  const saveMaxAttempts = () => {
    dispatch(setMaxPasswordAttempts(parseInt(chosenMaxPasswordAttempts)));
    AsyncStorage.setItem(STORAGE_STRINGS.PASSWORD_ATTEMPT_COUNT, chosenMaxPasswordAttempts);
    AsyncStorage.setItem(STORAGE_STRINGS.MAX_PASSWORD_ATTEMPTS, chosenMaxPasswordAttempts);
  }

  const resetPassword = passwordName => {
    deletePassword(passwordName);
    dispatch(setPassword(passwordName,""))
    if(passwordName == "login") {
      deletePassword("erasure")
      dispatch(setPassword("erasure",""));
    }
    setPasswordToReset("");
    setShowResetModal(false);
  }

  const handleResetAttempt = passwordName => {
    setPasswordToReset(passwordName);
    setShowResetModal(true);
    return new Promise(resolve => {
      resetPasswordPromiseRef.current = resolve
    })
  }

  const mainPasswordDescription = `You will be asked to enter this password when opening the app \
and accessing security-critical pages such as this one.`

  const erasurePasswordDescription = `Entering this password when opening the app will cause all data \
to be wiped from the application. Your public key will also be changed, \
meaning all contacts who have previously added you will need to add you again.`

  return (
    <NavigationWarningWrapper checkForChanges={() => {
      return loginPasswordHasChangesRef.current || 
      erasurePasswordHasChangesRef.current ||
      maxPasswordAttemptsHasChangesRef.current
    }}>
      <Header title="Password Settings" allowGoBack/>

      <ScrollView contentContainerStyle={styles.container}>

        <PasswordCreationBox
        primaryName="Main Password"
        secondaryName="Confirm Main Password"
        primaryPlaceholder="Password"
        secondaryPlaceholder="Confirm Password"
        originalValue={loginPasswordHash}
        changesAreAvailable={hasChanges => {loginPasswordHasChangesRef.current = hasChanges}}
        description={mainPasswordDescription}
        errors={loginPasswordErrors}
        save={(loginPassword,confirmLoginPassword) => savePassword(
          "login",
          loginPassword,
          confirmLoginPassword,
          setLoginPasswordErrors
        )}
        reset={() => handleResetAttempt("login")}
        disableReset={!hasLoginPassword}
        />

        <View style={{...styles.card, ...styles.container, marginTop : 10}}>
          <Text style={{...styles.inputTitle, fontSize : customStyle.scaledUIFontSize}}>Max Attempts</Text>
          <Text style={{fontSize : customStyle.scaledUIFontSize}}>A value of 0 allows for unlimited attempts</Text>
          <TextInput 
          value={chosenMaxPasswordAttempts}
          onSubmitEditing={() => chosenMaxPasswordAttempts.trim().length > 0 ? saveMaxAttempts() : setChosenMaxPasswordAttempts(maxPasswordAttempts.toString())}
          onChangeText={value => ![",","."].some(substr => value.includes(substr)) && !isNaN(Number(value)) && setChosenMaxPasswordAttempts(value)}
          keyboardType="number-pad"
          style={{...styles.input, fontSize : customStyle.scaledUIFontSize}}/>
          <View style={{flexDirection : "row"}}>
            <FlashTextButton
            normalText="Save"
            flashText="Saved!"
            disabled={chosenMaxPasswordAttempts == maxPasswordAttempts || chosenMaxPasswordAttempts.trim().length == 0}
            onPress={saveMaxAttempts}
            timeout={500}
            buttonStyle={{width : "100%", justifyContent : "center"}}
            textStyle={styles.buttonText}/>
          </View>
        </View>

        <PasswordCreationBox
        mainContainerStyle={{marginTop : 10}}
        primaryName="Erasure Password"
        secondaryName="Confirm Erasure Password"
        primaryPlaceholder="Password"
        secondaryPlaceholder="Confirm Password"
        originalValue={erasurePasswordHash}
        changesAreAvailable={hasChanges => {erasurePasswordHasChangesRef.current = hasChanges}}
        description={erasurePasswordDescription}
        errors={erasurePasswordErrors}
        save={(erasurePassword,confirmErasurePassword) => savePassword(
          "erasure",
          erasurePassword,
          confirmErasurePassword,
          setErasurePasswordErrors
        )}
        reset={() => handleResetAttempt("erasure")}
        disableReset={!hasErasurePassword}
        />

        <ConfirmationModal
        visible={showResetModal}
        onConfirm={() => {
          resetPassword(passwordToReset)
          resetPasswordPromiseRef.current(true);
        }}
        onCancel={() => {
          setShowResetModal(false)
          resetPasswordPromiseRef.current(false)
        }}
        titleText="Are you sure you want to reset this password?"
        />

      </ScrollView>
    </NavigationWarningWrapper>
  )
}

const styles = {
  container : {
    padding : 20,
    alignItems : "center",
  },
  input : {
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom : 10,
    alignSelf : "stretch",
    padding : 10,
    backgroundColor : palette.white,
    borderRadius : 5,
  },
  inputTitle : {
    fontWeight : "bold",
    marginBottom : 5
  },
  card : {
    backgroundColor : palette.white,
    padding : 20,
    borderRadius : 5,
    alignItems : "center",
    justifyContent : "center",
    elevation : 2
  },
}

export default PasswordSettings;
