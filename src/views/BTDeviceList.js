import React, { useState, useEffect,  useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Text, View, ScrollView, ActivityIndicator, TouchableOpacity, 
  NativeEventEmitter } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Bluetooth from '../nativeWrapper/Bluetooth';
import ServiceInterface from '../nativeWrapper/ServiceInterface';

import BTExchangeModal from './BTExchangeModal';
import Header from './Header';
import CustomButton from './CustomButton';

import { palette } from '../assets/palette';
import { useStateAndRef } from '../helper';
import { enableServicesForBluetoothScan, requestMakeDiscoverable } from '../common';
import { setLockable } from '../redux/actions/appStateActions';

const BTDeviceList = ({ navigation }) => {
  const dispatch = useDispatch();
  const [showModal, setShowModal] = useState(false);
  const [errors, setErrors] = useState([]);

  const customStyle = useSelector(state => state.chatReducer.styles);

  const [deviceList, setDeviceList, deviceRef] = useStateAndRef([],[]);
  const [scanning, setScanning, scanningRef] = useStateAndRef(false,false);

  const updateDeviceList = newDevice => {
    const existingDevice = deviceRef.current.findIndex(existingDevice => existingDevice.macAddress === newDevice.macAddress);
    if(existingDevice === -1) {
      setDeviceList([...deviceRef.current,{...newDevice, foundAgain : true}]);
    }
    else {
      let listCopy = [...deviceRef.current];
      listCopy[existingDevice] = {...listCopy[existingDevice], foundAgain : true}
      setDeviceList(listCopy)
    }
  }

  useEffect(() => {
    const eventEmitter = new NativeEventEmitter(Bluetooth);
    const serviceEventEmitter = new NativeEventEmitter(ServiceInterface);
    const bluetoothListener = eventEmitter.addListener("newBTDeviceFound", device => {
      updateDeviceList(device);
    });

    const scanStateChangeListener = eventEmitter.addListener("BTStateChange", state => {
      if(state === "DISCOVERY_STARTED") {
        setScanning(true);
      }
      else if (state === "DISCOVERY_FINISHED") {
        console.log("discovery finished")
        setScanning(false);
        setDeviceList(deviceRef.current.filter(device => device.foundAgain))
      }
    })


    const bluetoothAndLocationStateListener = serviceEventEmitter.addListener("bluetoothOrLocationStateChange", state => {
      if(state === "ADAPTER_TURNED_OFF" || state === "LOCATION_DISABLED") {
        console.log(scanningRef.current)
        if(scanningRef.current) {
          if(state === "ADAPTER_TURNED_OFF") {
            setErrors([{
              type : "bluetooth_not_enabled",
              text : "Bluetooth was turned off"
            }])
          }
          else if(state === "LOCATION_DISABLED") {
            setErrors([{
              type : "location_not_enabled",
              text : "Location was turned off"
            }])
          }
        }

        Bluetooth.cancelScanForDevices();
        setScanning(false);
      }
    })

    Bluetooth.scanForDevices()
    .catch(e => {
      setErrors([{
        type : "general_bluetooth",
        text : "Something went wrong, please try again"
      }])
      __DEV__ && console.log(e)
    })

    //cleanup
    return () => {
      bluetoothListener.remove();
      scanStateChangeListener.remove();
      bluetoothAndLocationStateListener.remove();
    }
  },[])

  //cancel bluetooth scan when user unfocuses this component
  useFocusEffect(useCallback(() => {
    return async () => await Bluetooth.cancelScanForDevices();
  },[]))

  const handleDeviceClick = async device => {
    await Bluetooth.cancelScanForDevices();
    await Bluetooth.listenAsServer();
    await Bluetooth.connectAsClient(device.macAddress);
    setShowModal(true);
  }

  const restartScan = async () => {
    setErrors([]);
    dispatch(setLockable(false))

    const servicesEnabled = await enableServicesForBluetoothScan();

    if(servicesEnabled) {
      const discoverable = await requestMakeDiscoverable();
      if(discoverable) {
        setDeviceList(deviceList.map(device => ({...device, foundAgain : false})));
        await Bluetooth.scanForDevices();
      }
    }
    dispatch(setLockable(true));
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
          {errors.map((error) =>
            <Text
            key={error.type}
            style={{...styles.error,fontSize : customStyle.scaledUIFontSize}}>
              {error.text}
            </Text>
          )}
        </View>


        <ScrollView contentContainerStyle={{...styles.BTList}}>
          {deviceList.map((device) =>
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
        onPress={async () => scanning ? await Bluetooth.cancelScanForDevices() : await restartScan()}
        buttonStyle={{marginTop : 10}}/>

        {showModal && <BTExchangeModal
        onRequestClose={() => setShowModal(false)}
        onSuccess={value => {
          setShowModal(false);
          navigation.navigate("editContact",value);
        }}
        onCancel={() => setShowModal(false)}/>}

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
