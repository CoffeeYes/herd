import React from 'react';
import { Text, View, TouchableOpacity, Dimensions } from 'react-native';
import QRCodeScanner from 'react-native-qrcode-scanner';
import CameraMarker from './CameraMarker';
import CustomButton from './CustomButton';

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
    reactivate={true}
    customMarker={<CameraMarker borderWidth={5} borderColor="white"/>}
    bottomContent={
      <CustomButton
      text="Cancel"
      onPress={() => navigation.goBack()}
      buttonStyle={{marginTop : 30}}/>
    }/>
  )
}

export default QRScanner;
