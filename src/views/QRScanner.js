import React from 'react';
import { Text, View } from 'react-native';
import QRCodeScanner from 'react-native-qrcode-scanner';
import Header from './Header'

const QRScanner = ({ navigation }) => {

  const handleRead = scanResult => {
    const publicKey = scanResult?.data
    navigation.navigate("createcontact", { publicKey : publicKey})
  }

  return (
    <QRCodeScanner
    onRead={handleRead}
    topContent={<Header title="QR Code Scanner" allowGoBack/>}/>
  )
}

export default QRScanner;
