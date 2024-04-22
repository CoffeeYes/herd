import React, { useState, useRef, forwardRef, useEffect } from 'react';
import { View, Text, TextInput } from 'react-native';
import { useSelector } from 'react-redux';
import Crypto from '../nativeWrapper/Crypto';

import { palette } from '../assets/palette';

import FlashTextButton from './FlashTextButton';

const PasswordField = forwardRef(({name, customStyle, onChangeText, value, onSubmitEditing, customInputStyle},ref) => {
  const titleStyle = {...styles.inputTitle, fontSize : customStyle.scaledUIFontSize};
  const inputStyle = {...styles.input, fontSize : customStyle.scaledUIFontSize, ...customInputStyle};

  return (
    <>
      <Text style={titleStyle}>{name}</Text>
      <TextInput
      secureTextEntry
      style={inputStyle}
      onChangeText={onChangeText}
      ref={ref}
      onSubmitEditing={onSubmitEditing}
      value={value}/>
    </>
  )
})

const PasswordCreationBox = ({ description, errors, primaryName, secondaryName,
                            primaryButtonText, primaryButtonFlashText, secondaryButtonText,
                            secondaryButtonFlashText, primaryButtonOnPress, secondaryButtonOnPress,
                            primaryButtonDisabled, secondaryButtonDisabled, mainContainerStyle,
                            originalValue, changesAreAvailable}) => {
  const customStyle = useSelector(state => state.chatReducer.styles);

  const [primaryInputText, setPrimaryInputText] = useState("");
  const [secondaryInputText, setSecondaryInputText] = useState("");

  const [saveDisabled, setSaveDisabled] = useState(false);

  const secondaryInputRef = useRef();

  const submit = async () => {
    const result = await primaryButtonOnPress(primaryInputText,secondaryInputText);
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

          <PasswordField
          name={primaryName}
          customStyle={customStyle}
          onChangeText={setPrimaryInputText}
          onSubmitEditing={() => secondaryInputRef.current.focus()}
          value={primaryInputText}/>

          <PasswordField
          name={secondaryName}
          customStyle={customStyle}
          onChangeText={setSecondaryInputText}
          ref={secondaryInputRef}
          onSubmitEditing={submit}
          value={secondaryInputText}/>

          <View style={{flexDirection : "row"}}>
            <FlashTextButton
            normalText={primaryButtonText}
            flashText={primaryButtonFlashText}
            disabled={saveDisabled || primaryButtonDisabled}
            onPress={submit}
            timeout={500}
            buttonStyle={{...styles.button, width : "50%"}}
            textStyle={styles.buttonText}/>

            <FlashTextButton
            normalText={secondaryButtonText}
            flashText={secondaryButtonFlashText}
            disabled={secondaryButtonDisabled}
            onPress={secondaryButtonOnPress}
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
    marginTop : 10,
    borderRadius : 5,
  },
  buttonText : {
    color : palette.white,
    fontWeight : "bold",
    fontFamily : "Open-Sans",
    textAlign : "center"
  },
  input : {
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom : 10,
    alignSelf : "stretch",
    padding : 10,
    backgroundColor : palette.white,
    borderRadius : 5
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
  error : {
    color : palette.red,
    fontWeight : "bold"
  },
  errorContainer : {
    marginVertical : 10
  }
}

export default PasswordCreationBox;
