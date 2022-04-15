import React, { useState } from 'react';
import { View, Text, TextInput, Dimensions } from 'react-native';
import CustomButton from './CustomButton';


const PasswordLockScreen = ({ navigation, route }) => {
  const [password, setPassword] = useState("");

  const checkPassword = () => {
    //determine if password is correct, and navigate to route.params.navigationTarget if so
  }

  return (
    <View style={styles.container}>
      <Text style={styles.inputTitle}>Enter Your Password : </Text>
      <TextInput
      style={styles.input}
      onChangeText={setPassword}
      value={password}/>
      <CustomButton
      text="Submit"
      onPress={checkPassword}/>
    </View>
  )
}

const styles = {
  container : {
    alignItems : "center",
    justifyContent : "center",
    backgroundColor : "#e05e3f",
    flex : 1
  },
  input : {
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom : 10,
    width : Dimensions.get('window').width * 0.9,
    alignSelf : "center",
    padding : 10,
    backgroundColor : "white",
    borderRadius : 5
  },
  inputTitle : {
    fontWeight : "bold",
    marginBottom : 5,
    color : "white"
  },
}

export default PasswordLockScreen;
