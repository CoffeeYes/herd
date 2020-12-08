import React, { useEffect } from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import Bluetooth from '../nativeWrapper/Bluetooth';

const AddContact = () => {

  return (
    <>
    <View style={styles.header}>
      <Text style={{color : "white"}}>Add Contact</Text>
    </View>
    <View style={styles.main}>
      <Text>Enable Bluetooth and place your phones next to each other!</Text>
      <TouchableOpacity
      onPress={() => Bluetooth.scanForDevices()}
      style={styles.button}>
        <Text style={{color : "white"}}>Start Scanning</Text>
      </TouchableOpacity>
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
  },
  button : {
    backgroundColor : "#E86252",
    padding : 10,
    alignSelf : "center",
    marginTop : 10,
    borderRadius : 5
  }
}

export default AddContact;
