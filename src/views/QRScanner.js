import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Text, View, TouchableOpacity, Dimensions } from 'react-native';
import QRCodeScanner from 'react-native-qrcode-scanner';
import CameraMarker from './CameraMarker';
import CustomButton from './CustomButton';
import Orientation from "react-native-orientation-locker";

const QRScanner = ({ navigation }) => {
  const [active, setActive] = useState(true);

  const handleRead = scanResult => {
    const result = JSON.parse(scanResult?.data)
    setActive(false);
    navigation.navigate("createcontact", {
      ...(result.key && {publicKey : result.key}),
      ...(result.name && {name : result.name})
      }
    )
  }

  useFocusEffect(() => {
    setActive(true)
  })

  useEffect(() => {
    Orientation.lockToPortrait();
    return Orientation.unlockAllOrientations;
  },[])

  return (
    <>
    {active &&
    <QRCodeScanner
    showMarker
    onRead={handleRead}
    reactivate={true}
    customMarker={<CameraMarker borderWidth={5} borderColor="white"/>}
    cameraStyle={styles.camera}
    containerStyle={styles.container}
    bottomContent={
      <CustomButton
      text="Cancel"
      onPress={() => navigation.goBack()}
      buttonStyle={{marginTop : 30}}/>
    }/>}
    </>
  )
}

const styles = {
  container : {
    alignItems : "center",
    justifyContent : "center"
  },
  camera : {
    maxHeight : Dimensions.get('window').height * 0.8,
    maxWidth : Dimensions.get('window').width
  },
}

export default QRScanner;
