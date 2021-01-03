import React, { useState, useEffect } from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import Bluetooth from '../nativeWrapper/Bluetooth';

const AddContact = ({ navigation }) => {
  const [error,setError] = useState("");

  useEffect(() => {
    const checkForBT = setInterval(async () => {
      let adapter = await Bluetooth.checkForBTAdapter();
      let enabled = await Bluetooth.checkBTEnabled();

      if(!adapter) {
        return setError("No Bluetooth Adapters Found");
      }
      else if(!enabled) {
        setError("Bluetooth is not enabled")
      }
      else {
        setError("")
      }
    },200)
    return () => clearInterval(checkForBT);
  },[])

  return (
    <>
      <View style={styles.header}>
        <Text style={{color : "white"}}>Add Contact</Text>
      </View>
      <View style={styles.main}>
        <Text style={styles.error}>{error}</Text>
        <Text>Enable Bluetooth and place your phones next to each other!</Text>
        <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("createcontact")}>
          <Text style={styles.buttonText}>Import Key</Text>
        </TouchableOpacity>

        <TouchableOpacity
        onPress={() => navigation.navigate("BTDeviceList")}
        style={!!error ? styles.buttonDisabled : styles.button}
        disabled={!!error}>
          <Text style={styles.buttonText}>Start Scanning</Text>
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
  },
  buttonText : {
    color : "white",
    fontWeight : "bold"
  },
  buttonDisabled : {
    backgroundColor : "grey",
    padding : 10,
    alignSelf : "center",
    marginTop : 10,
    borderRadius : 5
  },
  error : {
    color : "red",
    fontWeight : "bold",
    textAlign : "center",
    fontSize : 18
  }
}

export default AddContact;
