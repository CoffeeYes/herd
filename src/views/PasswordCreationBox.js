import React, { useState, useRef, forwardRef } from 'react';
import { View, Text, TextInput, Dimensions } from 'react-native';
import { useSelector } from 'react-redux';

import { palette } from '../assets/palette';

import { useScreenAdjustedSize } from '../helper';

import FlashTextButton from './FlashTextButton';

const PasswordField = forwardRef(({name, customStyle, onChangeText, value, onSubmitEditing, customInputStyle},ref) => {
  const titleStyle = {...styles.inputTitle, fontSize : customStyle.uiFontSize};
  const inputStyle = {...styles.input, fontSize : customStyle.uiFontSize, ...customInputStyle};

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
                            primaryButtonDisabled, secondaryButtonDisabled, mainContainerStyle }) => {
  const customStyle = useSelector(state => state.chatReducer.styles);
  const [primaryInputText, setPrimaryInputText] = useState("");
  const [secondaryInputText, setSecondaryInputText] = useState("");

  const secondaryInputRef = useRef();

  const submit = async () => {
    const result = await primaryButtonOnPress(primaryInputText,secondaryInputText);
    if(result) {
      setPrimaryInputText("");
      setSecondaryInputText("");
    }
  }

  const titleStyle = {...styles.inputTitle, fontSize : customStyle.uiFontSize};
  const inputStyle = {...styles.input, fontSize : customStyle.uiFontSize};

  const buttonWidth = useScreenAdjustedSize( 0.4, 0.4);
  const inputWidth = useScreenAdjustedSize( 0.8, 0.8);
  const containerWidth = useScreenAdjustedSize(0.9,0.9);

  return (
        <View style={{...styles.card, width : containerWidth,...mainContainerStyle }}>

          {description &&
          <Text multiline style={{fontSize : customStyle.uiFontSize}}>
            {description}
          </Text>}

          {errors.map((error,index) =>
          <Text
          key={error.replace(" ","_")}
          style={{...styles.error, fontSize : customStyle.uiFontSize}}>
            {error}
          </Text>)}

          <PasswordField
          name={primaryName}
          customStyle={customStyle}
          customInputStyle={{width : inputWidth}}
          onChangeText={setPrimaryInputText}
          onSubmitEditing={() => secondaryInputRef.current.focus()}
          value={primaryInputText}/>

          <PasswordField
          name={secondaryName}
          customStyle={customStyle}
          customInputStyle={{width : inputWidth}}
          onChangeText={setSecondaryInputText}
          ref={secondaryInputRef}
          onSubmitEditing={submit}
          value={secondaryInputText}/>

          <View style={{flexDirection : "row"}}>
            <FlashTextButton
            normalText={primaryButtonText}
            flashText={primaryButtonFlashText}
            disabled={ primaryInputText.trim().length === 0 || secondaryInputText.trim().length === 0 || primaryButtonDisabled}
            onPress={submit}
            timeout={500}
            buttonStyle={{...styles.button, width : buttonWidth}}
            textStyle={styles.buttonText}/>

            <FlashTextButton
            normalText={secondaryButtonText}
            flashText={secondaryButtonFlashText}
            disabled={secondaryButtonDisabled}
            onPress={secondaryButtonOnPress}
            buttonStyle={{...styles.button, marginLeft : 10,width : buttonWidth}}
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
    width : Dimensions.get('window').width * 0.8,
    alignSelf : "center",
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
  }
}

export default PasswordCreationBox;
