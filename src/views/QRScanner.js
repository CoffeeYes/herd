import React from 'react';
import { Text } from 'react-native';
import QRCodeScanner from 'react-native-qrcode-scanner';

const QRScanner = ({ navigation }) => {

  const handleRead = scanResult => {
    const publicKey = scanResult?.data
    navigation.navigate("createcontact", { publicKey : publicKey})
  }
  
  return (
    <QRCodeScanner
    onRead={handleRead}/>
  )
}

export default QRScanner;
