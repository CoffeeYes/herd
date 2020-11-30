import React from 'react';
import { Text, View } from 'react-native';

const AddContact = () => {
  return (
    <>
    <View style={styles.header}>
      <Text style={{color : "white"}}>Add Contact</Text>
    </View>
    <View style={styles.main}>
      <Text>Enable NFC and place your phones next to each other!</Text>
    </View>
    </>
  )
}

const styles = {
  header : {
    backgroundColor : "#E86252",
    padding : 15
  },
  main : {
    alignSelf : "center",
    marginTop : "auto",
    marginBottom : "auto"
  }
}

export default AddContact;
