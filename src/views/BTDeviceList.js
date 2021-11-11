import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Text, View, ScrollView, ActivityIndicator, TouchableOpacity, Dimensions,
  NativeEventEmitter } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Bluetooth from '../nativeWrapper/Bluetooth';

import BTExchangeModal from './BTExchangeModal';
import Header from './Header';
import CustomButton from './CustomButton';

const BTDeviceList = () => {
  const [deviceList, setDeviceList] = useState([]);
  const [scanning, setScanning] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [chosenDevice, setChosenDevice] = useState({});
  const [error, setError] = useState("");

  const deviceRef = useRef(deviceList);
  const scanningRef = useRef(scanning);

  const updateDeviceList = newDevice => {
    if(!deviceRef.current.find(existingDevice => existingDevice.macAddress === newDevice.macAddress)) {
      deviceRef.current = [...deviceRef.current,newDevice];
      setDeviceList(deviceRef.current);
    }
  }

  useEffect(() => {
    const eventEmitter = new NativeEventEmitter(Bluetooth);
    const bluetoothListener = eventEmitter.addListener("newBTDeviceFound", device => {
      updateDeviceList(device);
    });

    const scanStateChangeListener = eventEmitter.addListener("BTStateChange", state => {
      console.log(state)
      if(state === "DISCOVERY_STARTED") {
        scanningRef.current = true;
        setScanning(scanningRef.current);
      }
      else if (state === "DISCOVERY_FINISHED") {
        scanningRef.current = false;
        setScanning(scanningRef.current);
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
        {scanning &&
        <View>
          <Text>Scanning...</Text>
          <ActivityIndicator size="large" color="#e05e3f"/>
        </View>
        }
        {error.length > 0 &&
        <Text style={styles.error}>{error}</Text>
        }
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
        text="Re-Scan"
        onPress={restartScan}
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
    padding : 20
  },
  BTList : {
    backgroundColor : "#D8D8D8",
    width : Dimensions.get("window").width - 40,
    padding : 10,
  },
  deviceContainer : {
    padding : 10,
    backgroundColor : "white",
    marginTop : 2,
    borderBottomColor : "black"
  },
  error : {
    color : "red",
    fontWeight : "bold"
  }
}

export default BTDeviceList;
