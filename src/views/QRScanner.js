import React from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import QRCodeScanner from 'react-native-qrcode-scanner';

const QRScanner = ({ navigation }) => {

  const handleRead = scanResult => {
    const publicKey = scanResult?.data
    navigation.navigate("createcontact", { publicKey : publicKey})
  }

  return (
    <QRCodeScanner
    onRead={handleRead}
    bottomContent={
      <TouchableOpacity
      style={styles.button}
      onPress={() => navigation.goBack()}>
        <Text style={styles.buttonText}>Cancel</Text>
      </TouchableOpacity>
    }/>
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
    fontFamily : "Open-Sans",
    textAlign : "center"
  },
}

export default QRScanner;
