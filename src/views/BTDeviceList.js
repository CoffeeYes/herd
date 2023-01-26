import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Text, View, ScrollView, ActivityIndicator, TouchableOpacity, Dimensions,
  NativeEventEmitter } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Bluetooth from '../nativeWrapper/Bluetooth';

import BTExchangeModal from './BTExchangeModal';
import Header from './Header';
import CustomButton from './CustomButton';

import { palette } from '../assets/palette';

const BTDeviceList = () => {
  const [deviceList, _setDeviceList] = useState([]);
  const [scanning, _setScanning] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [chosenDevice, setChosenDevice] = useState({});
  const [error, setError] = useState("");

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
    .catch(e => setError("Something went wrong, please try again"))

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
    const btEnabled = await Bluetooth.checkBTEnabled();
    const locationEnabled = await Bluetooth.checkLocationEnabled();

    if (!btEnabled || ! locationEnabled) {
      return setError("Bluetooth and Location must be enabled to scan for devices")
    }
    else {
      setError("");
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
          <Text>{scanning ? "Scanning..." : ""}</Text>
          <ActivityIndicator size="large" color={palette.primary} animating={scanning}/>
        </View>

        {error.length > 0 &&
        <Text style={styles.error}>{error}</Text>}

        <ScrollView contentContainerStyle={styles.BTList}>
          {deviceList.map((device,index) =>
            <TouchableOpacity
            key={index}
            style={styles.deviceContainer}
            onPress={ () => handleDeviceClick(device)}>
              <Text>{device.name || "Nameless Device"}</Text>
              <Text>{device.macAddress}</Text>
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
    width : Dimensions.get("window").width - 40,
    padding : 10,
    flex : 1
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
