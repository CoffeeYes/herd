import React, { forwardRef } from 'react';
import { useSelector } from 'react-redux';
import { View, Text, TextInput } from 'react-native';

import { palette } from '../assets/palette';

const PasswordField = forwardRef(({name, containerStyle, customInputStyle, onChangeText, value, onSubmitEditing,  secureTextEntry = true, blurOnSubmit=true},ref) => {

  const customStyle = useSelector(state => state.appStateReducer.styles);
  const titleStyle = {...styles.inputTitle, fontSize : customStyle.scaledUIFontSize};
  const inputStyle = {...styles.input, fontSize : customStyle.scaledUIFontSize, ...customInputStyle};

  return (
    <View style={containerStyle}>
      <Text style={titleStyle}>{name}</Text>
      <View style={{flexDirection : "row", alignItems : "center"}}>
        <TextInput
        secureTextEntry={secureTextEntry}
        style={inputStyle}
        onChangeText={onChangeText}
        ref={ref}
        blurOnSubmit={blurOnSubmit}
        onSubmitEditing={onSubmitEditing}
        value={value}/>
      </View>
    </View>
  )
})

export default PasswordField;

const styles = {
  input : {
    borderColor: 'gray',
    borderWidth: 1,
    alignSelf : "stretch",
    padding : 10,
    backgroundColor : palette.white,
    borderRadius : 5,
    flex : 1
  },
  inputTitle : {
    fontWeight : "bold",
    marginBottom : 5
  },
}
