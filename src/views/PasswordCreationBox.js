import React, { useState, useRef } from 'react';
import { View, Text, TextInput, Dimensions } from 'react-native';

import { palette } from '../assets/palette';

import FlashTextButton from './FlashTextButton';

const PasswordCreationBox = ({ description, error, primaryName, secondaryName,
                            primaryButtonText, primaryButtonFlashText, secondaryButtonText,
                            secondaryButtonFlashText, primaryButtonOnPress, secondaryButtonOnPress,
                            primaryButtonDisabled, secondaryButtonDisabled, mainContainerStyle }) => {

  const [primaryInputText, setPrimaryInputText] = useState("");
  const [secondaryInputText, setSecondaryInputText] = useState("");

  const primaryInputRef = useRef();
  const secondaryInputRef = useRef();

  const submit = async () => {
    const result = await primaryButtonOnPress(primaryInputText,secondaryInputText);
    if(result) {
      setPrimaryInputText("");
      setSecondaryInputText("");
    }
  }

  return (
        <View style={{...mainContainerStyle, ...styles.card}}>

          {description &&
          <Text multiline>
            {description}
          </Text>}

          <Text style={styles.error}>{error}</Text>

          <Text style={styles.inputTitle}>{primaryName}</Text>
          <TextInput
          secureTextEntry
          style={styles.input}
          onChangeText={setPrimaryInputText}
          ref={primaryInputRef}
          onSubmitEditing={() => secondaryInputRef.current.focus()}
          value={primaryInputText}/>

          <Text style={styles.inputTitle}>{secondaryName}</Text>
          <TextInput
          secureTextEntry
          style={styles.input}
          onChangeText={setSecondaryInputText}
          ref={secondaryInputRef}
          onSubmitEditing={() => submit()}
          value={secondaryInputText}/>

          <View style={{flexDirection : "row"}}>
            <FlashTextButton
            normalText={primaryButtonText}
            flashText={primaryButtonFlashText}
            disabled={ primaryInputText.trim().length === 0 || secondaryInputText.trim().length === 0 || primaryButtonDisabled}
            onPress={() => submit()}
            timeout={500}
            buttonStyle={styles.button}
            textStyle={styles.buttonText}/>

            <FlashTextButton
            normalText={secondaryButtonText}
            flashText={secondaryButtonFlashText}
            disabled={secondaryButtonDisabled}
            onPress={() => secondaryButtonOnPress()}
            timeout={0}
            buttonStyle={{...styles.button, marginLeft : 10}}
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
    color : "white",
    fontWeight : "bold",
    fontFamily : "Open-Sans",
    textAlign : "center"
  },
  input : {
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom : 10,
    width : Dimensions.get('window').width * 0.8,
    alignSelf : "center",
    padding : 10,
    backgroundColor : "white",
    borderRadius : 5
  },
  inputTitle : {
    fontWeight : "bold",
    marginBottom : 5
  },
  card : {
    backgroundColor : "white",
    padding : 20,
    borderRadius : 5,
    alignItems : "center",
    justifyContent : "center",
    elevation : 2
  },
  error : {
    color : "red",
    fontWeight : "bold"
  }
}

export default PasswordCreationBox;
