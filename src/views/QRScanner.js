import React from 'react';
import { Text, View, TouchableOpacity, Dimensions } from 'react-native';
import QRCodeScanner from 'react-native-qrcode-scanner';
import CameraMarker from './CameraMarker';

const QRScanner = ({ navigation }) => {

  const handleRead = scanResult => {
    const result = JSON.parse(scanResult?.data)
    navigation.navigate("createcontact", {
      ...(result.key && {publicKey : result.key}),
      ...(result.name && {name : result.name})
      }
    )
  }

  return (
    <QRCodeScanner
    showMarker
    onRead={handleRead}
    customMarker={<CameraMarker borderWidth={5} borderColor="white"/>}
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
  }
}

export default QRScanner;
