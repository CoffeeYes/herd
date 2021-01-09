import React, { useState, useEffect, useRef } from 'react';
import { Text, View, ScrollView, ActivityIndicator, TouchableOpacity, Dimensions,
  NativeEventEmitter } from 'react-native';
import Bluetooth from '../nativeWrapper/Bluetooth';

const BTDeviceList = () => {
  const [deviceList, setDeviceList] = useState([]);

  const deviceRef = useRef(deviceList);

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
    })

    const scanner = Bluetooth.scanForDevices();

    //cleanup
    return () => {
      bluetoothListener.remove();
    }
  },[])

  return (
    <View style={styles.mainContainer}>
      <Text>Scanning...</Text>
      <ActivityIndicator size="large" color="#e05e3f"/>
      <ScrollView contentContainerStyle={styles.BTList}>
        {deviceList.map((device,index) =>
          <TouchableOpacity key={index} style={styles.deviceContainer}>
            <Text>{device.name || "Nameless Device"}</Text>
            <Text>{device.macAddress}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
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
  }
}

export default BTDeviceList;