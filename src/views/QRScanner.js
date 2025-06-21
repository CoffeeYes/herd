import React, { useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import QRCodeScanner from 'react-native-qrcode-scanner';
import CameraMarker from './CameraMarker';
import { setLockable } from '../redux/actions/appStateActions';
import { useDispatch } from 'react-redux';

const QRScanner = ({ navigation }) => {
  const dispatch = useDispatch();

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
    return () => {
      dispatch(setLockable(true));
    }
  })

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
  }
}

export default QRScanner;
