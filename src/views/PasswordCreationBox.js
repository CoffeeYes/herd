import React, { useState, useRef, useEffect } from 'react';
import { View, Text } from 'react-native';
import { useSelector } from 'react-redux';
import Crypto from '../nativeWrapper/Crypto';

import { palette } from '../assets/palette';

import FlashTextButton from './FlashTextButton';
import CustomButton from './CustomButton';
import { TouchableOpacity } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import PasswordField from './PasswordField';

const PasswordCreationBox = ({ description, errors, primaryName, secondaryName,
                            primaryPlaceholder, secondaryPlaceholder,
                            disableSave, disableReset, mainContainerStyle, save, reset,
                            originalValue, changesAreAvailable}) => {
  const customStyle = useSelector(state => state.appStateReducer.styles);

  const [primaryInputText, setPrimaryInputText] = useState("");
  const [secondaryInputText, setSecondaryInputText] = useState("");
  const [secureEntry, setSecureEntry] = useState(true);

  const [saveDisabled, setSaveDisabled] = useState(false);

  const secondaryInputRef = useRef();

  const submit = async () => {
    const result = await save(primaryInputText,secondaryInputText);
    if(result) {
      setPrimaryInputText("");
      setSecondaryInputText("");
    }
  }

  const checkForChanges = async () => {
    const hashesMatch = await checkHashesMatch();
    return (
      (primaryInputText.trim().length > 0 || 
      secondaryInputText.trim().length > 0) && !hashesMatch
    )
  }

  const checkHashesMatch = async () => {
    const primaryTextHash = await Crypto.createHash(primaryInputText)
    const secondaryTextHash = await Crypto.createHash(secondaryInputText)
    const primaryFieldMatches = await Crypto.compareHashes(primaryTextHash,originalValue);
    const secondaryFieldMatches = await Crypto.compareHashes(secondaryTextHash,originalValue);
    return primaryFieldMatches && secondaryFieldMatches;
  }

  useEffect(() => {
    (async () => {
      changesAreAvailable?.(await checkForChanges());
      const matchesExisting = await checkHashesMatch();
      setSaveDisabled(
        matchesExisting ||
        primaryInputText.trim().length == 0 ||
        secondaryInputText.trim().length == 0 ||
        primaryInputText.trim().length != secondaryInputText.trim().length
      )
    })()
  },[primaryInputText, secondaryInputText])

  const handleReset = async () => {
    const wasReset = await reset?.();
    if(wasReset) {
      setPrimaryInputText("");
      setSecondaryInputText("");
    }
  }

  return (
    <View style={{...styles.card,...mainContainerStyle }}>

      {description &&
      <Text multiline style={{fontSize : customStyle.scaledUIFontSize}}>
        {description}
      </Text>}

      <View style={styles.errorContainer}>
        {errors.map((error) =>
        <Text
        key={error?.type || error.replace(" ","_")}
        style={{...styles.error, fontSize : customStyle.scaledUIFontSize}}>
          {` - ${error?.text || error}`}
        </Text>)}
      </View>

      <View style={styles.passwordFieldContainer}>
        <View style={{flex : 1}}>
          <PasswordField
          secureTextEntry={secureEntry}
          name={primaryName}
          placeholder={primaryPlaceholder}
          containerStyle={{marginBottom: 10}}
          onChangeText={setPrimaryInputText}
          onSubmitEditing={() => primaryInputText.trim().length > 0 && secondaryInputRef.current.focus()}
          value={primaryInputText}/>

          <PasswordField
          secureTextEntry={secureEntry}
          name={secondaryName}
          placeholder={secondaryPlaceholder}
          onChangeText={setSecondaryInputText}
          ref={secondaryInputRef}
          onSubmitEditing={() => !saveDisabled && !disableSave && submit()}
          blurOnSubmit={!saveDisabled && !disableSave}
          value={secondaryInputText}/>
        </View>

        <TouchableOpacity 
        style={{marginLeft : 10, marginTop : 15}}
        onPress={() => setSecureEntry(!secureEntry)}>
          <Icon name={secureEntry ?  "eye-off" : "eye"} size={32} color={palette.primary}/>
        </TouchableOpacity>
      </View>

      <View style={{flexDirection : "row"}}>
        <FlashTextButton
        normalText="Save"
        flashText="Saved!"
        disabled={saveDisabled || disableSave}
        onPress={submit}
        timeout={500}
        buttonStyle={{...styles.button, width : "50%"}}
        textStyle={styles.buttonText}/>

        <CustomButton
        text="Reset"
        disabled={disableReset}
        onPress={handleReset}
        buttonStyle={{...styles.button, marginLeft : 10,width : "50%"}}
        textStyle={styles.buttonText}/>
      </View>
    </View>
  )
}

const styles = {
  container : {
    padding : 20,
    alignItems : "center",
  },
  button : {
    backgroundColor : palette.primary,
    padding : 10,
    alignSelf : "center",
    justifyContent : "center",
    marginTop : 10,
    borderRadius : 5,
  },
  buttonText : {
    color : palette.white,
    fontWeight : "bold",
    textAlign : "center",
    ...(Platform.OS === 'android' && {fontFamily : "Open-Sans"})
  },
  card : {
    backgroundColor : palette.white,
    padding : 20,
    borderRadius : 5,
    alignItems : "center",
    justifyContent : "center",
    elevation : 2
  },
  error : {
    color : palette.red,
    fontWeight : "bold"
  },
  errorContainer : {
    marginVertical : 10
  },
  passwordFieldContainer : {
    flexDirection : "row", 
    justifyContent : "center",
    alignItems : "center", 
    marginBottom : 10
  }
}

export default PasswordCreationBox;
