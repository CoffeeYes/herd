import React, { useState } from 'react';
import {Text, TouchableOpacity } from 'react-native';

const SaveButton = ({ saveFunction }) => {
  const [buttonText, setButtonText] = useState("Save")

  const save = async () => {
    await saveFunction();
    setButtonText("Saved!");
    setTimeout(() => {
      setButtonText("Save");
    },500)
  }
  return (
    <TouchableOpacity
    style={{...styles.button,marginBottom : 10}}
    onPress={save}>
      <Text style={styles.buttonText}>{buttonText}</Text>
    </TouchableOpacity>
  )
}

const styles = {
  button : {
    backgroundColor : "#E86252",
    padding : 10,
    alignSelf : "center",
    marginTop : 10,
    borderRadius : 5
  },
  buttonText : {
    color : "white",
    fontWeight : "bold",
    textAlign : "center"
  },
}

export default SaveButton;
