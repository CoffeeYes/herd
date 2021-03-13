import React, { useState, useEffect, useRef } from 'react';
import { Text, View, ScrollView, ActivityIndicator, TouchableOpacity, Dimensions,
  NativeEventEmitter } from 'react-native';
import Bluetooth from '../nativeWrapper/Bluetooth';

import BTExchangeModal from './BTExchangeModal';

const BTDeviceList = () => {
  const [deviceList, setDeviceList] = useState([]);
  const [scanning, setScanning] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [chosenDevice, setChosenDevice] = useState({});

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

    const scanner = Bluetooth.scanForDevices();

    //cleanup
    return () => {
      bluetoothListener.remove();
      scanStateChangeListener.remove();
    }
  },[])

  const handleDeviceClick = async device => {
    await Bluetooth.cancelScanForDevices();
    const server = await Bluetooth.listenAsServer();
    const client = await Bluetooth.connectAsClient(device.macAddress);
    setChosenDevice(device);
    setShowModal(true);
  }

  const restartScan = async () => {
    await Bluetooth.scanForDevices();
  }

  return (
    <View style={styles.mainContainer}>
      {scanning &&
      <View>
        <Text>Scanning...</Text>
        <ActivityIndicator size="large" color="#e05e3f"/>
      </View>
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

      <TouchableOpacity
      style={styles.button}
      onPress={restartScan}>
        <Text style={styles.buttonText}>Re-scan</Text>
      </TouchableOpacity>

      <BTExchangeModal
      visible={showModal}
      setVisible={setShowModal}/>

    </View>
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
    textAlign : "center",
    fontFamily : "Open-Sans"
  }
}

export default BTDeviceList;
