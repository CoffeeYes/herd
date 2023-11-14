import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Text, View, ScrollView, ActivityIndicator, TouchableOpacity, Dimensions,
  NativeEventEmitter } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Bluetooth from '../nativeWrapper/Bluetooth';

import BTExchangeModal from './BTExchangeModal';
import Header from './Header';
import CustomButton from './CustomButton';

import { palette } from '../assets/palette';
import { useScreenAdjustedSize } from '../helper';

const BTDeviceList = () => {
  const [deviceList, _setDeviceList] = useState([]);
  const [scanning, _setScanning] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [chosenDevice, setChosenDevice] = useState({});
  const [errors, setErrors] = useState([]);

  const customStyle = useSelector(state => state.chatReducer.styles);

  const deviceRef = useRef(deviceList);
  const scanningRef = useRef(scanning);

  const setScanning = data => {
    scanningRef.current = data;
    _setScanning(data)
  }

  const setDeviceList = data => {
    deviceRef.current = data;
    _setDeviceList(data);
  }

  const updateDeviceList = newDevice => {
    if(!deviceRef.current.find(existingDevice => existingDevice.macAddress === newDevice.macAddress)) {
      setDeviceList([...deviceRef.current,newDevice]);
    }
  }

  useEffect(() => {
    const eventEmitter = new NativeEventEmitter(Bluetooth);
    const bluetoothListener = eventEmitter.addListener("newBTDeviceFound", device => {
      updateDeviceList(device);
    });

    const scanStateChangeListener = eventEmitter.addListener("BTStateChange", state => {
      if(state === "DISCOVERY_STARTED") {
        setScanning(true);
      }
      else if (state === "DISCOVERY_FINISHED") {
        setScanning(false);
      }
    })

    const scanner = Bluetooth.scanForDevices()
    .catch(e => setErrors(["Something went wrong, please try again"]))

    //cleanup
    return () => {
      bluetoothListener.remove();
      scanStateChangeListener.remove();
    }
  },[])

  //cancel bluetooth scan when user unfocuses this component
  useFocusEffect(useCallback(() => {
    return async () => await Bluetooth.cancelScanForDevices();
  },[])
  )

  const handleDeviceClick = async device => {
    await Bluetooth.cancelScanForDevices();
    const server = await Bluetooth.listenAsServer();
    const client = await Bluetooth.connectAsClient(device.macAddress);
    setChosenDevice(device);
    setShowModal(true);
  }

  const restartScan = async () => {
    let restartErrors = [];
    const btEnabled = await Bluetooth.checkBTEnabled();
    const locationEnabled = await Bluetooth.checkLocationEnabled();

    !btEnabled && restartErrors.push(
      "Please enable bluetooth"
    )
    !locationEnabled && restartErrors.push(
      "Please enable location services"
    )

    if (restartErrors.length > 0) {
      return setErrors(restartErrors);
    }
    else {
      setErrors([]);
      await Bluetooth.scanForDevices();
    }
  }

  return (
    <>
      <Header
      title="Bluetooth Scan"
      allowGoBack/>

      <View style={styles.mainContainer}>
        <View>
          <Text style={{fontSize : customStyle.scaledUIFontSize}}>{scanning ? "Scanning..." : ""}</Text>
          <ActivityIndicator size="large" color={palette.primary} animating={scanning}/>
          {errors.map((error,index) =>
            <Text
            key={index}
            style={{...styles.error,fontSize : customStyle.scaledUIFontSize}}>
              {error}
            </Text>
          )}
        </View>


        <ScrollView contentContainerStyle={{...styles.BTList}}>
          {deviceList.map((device,index) =>
            <TouchableOpacity
            key={device.macAddress}
            style={styles.deviceContainer}
            onPress={ () => handleDeviceClick(device)}>
              <Text style={{fontSize : customStyle.scaledUIFontSize}}>{device.name || "Nameless Device"}</Text>
              <Text style={{fontSize : customStyle.scaledUIFontSize}}>{device.macAddress}</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        <CustomButton
        text={scanning ? "Cancel Scan" : "Re-Scan"}
        onPress={() => scanning ? Bluetooth.cancelScanForDevices() : restartScan()}
        buttonStyle={{marginTop : 10}}/>

        <BTExchangeModal
        visible={showModal}
        setVisible={setShowModal}/>

      </View>
    </>
  )
}

const styles = {
  mainContainer : {
    alignItems : "center",
    padding : 20,
    flex : 1
  },
  BTList : {
    backgroundColor : palette.mediumgrey,
    padding : 10,
    flexGrow : 1,
    minWidth : "100%"
  },
  deviceContainer : {
    padding : 10,
    backgroundColor : palette.white,
    marginTop : 2,
    borderBottomColor : palette.black
  },
  error : {
    color : palette.red,
    fontWeight : "bold"
  }
}

export default BTDeviceList;
