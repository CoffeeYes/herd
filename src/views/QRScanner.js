import React, { useState, useEffect, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Text, View, TouchableOpacity, Dimensions } from 'react-native';
import QRCodeScanner from 'react-native-qrcode-scanner';
import CameraMarker from './CameraMarker';
import CustomButton from './CustomButton';
import Orientation from "react-native-orientation-locker";

import { palette } from '../assets/palette';

import { useScreenAdjustedSize } from '../helper';

const QRScanner = ({ navigation }) => {

  const scannerRef = useRef();

  const handleRead = scanResult => {
    const result = JSON.parse(scanResult?.data)
    navigation.navigate("editContact", {
      ...(result.key && {publicKey : result.key}),
      ...(result.name && {name : result.name})
      }
    )
  }

  useFocusEffect(() => {
    scannerRef.current.reactivate();
  })

  useEffect(() => {
    // Orientation.lockToPortrait();
    // return Orientation.unlockAllOrientations;
  },[])

  return (
    <QRCodeScanner
    showMarker
    ref={ref => {scannerRef.current = ref}}
    onRead={handleRead}
    reactivate={false}
    customMarker={<CameraMarker borderWidth={5}/>}
    containerStyle={styles.container}/>
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
