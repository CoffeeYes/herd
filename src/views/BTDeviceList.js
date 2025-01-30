import React, { useState, useEffect,  useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Text, View, ScrollView, ActivityIndicator, TouchableOpacity, 
  NativeEventEmitter, AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Bluetooth from '../nativeWrapper/Bluetooth';
import ServiceInterface from '../nativeWrapper/ServiceInterface';
import PermissionManager from '../nativeWrapper/PermissionManager';

import BTExchangeModal from './BTExchangeModal';
import Header from './Header';
import CustomButton from './CustomButton';
import ConfirmationModal from './ConfirmationModal';

import { palette } from '../assets/palette';
import { useStateAndRef } from '../helper';
import { requestMakeDiscoverable, requestEnableBluetooth } from '../common';
import { setLockable } from '../redux/actions/appStateActions';

const BTDeviceList = ({ navigation }) => {
  const dispatch = useDispatch();
  const [showModal, setShowModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [errors, setErrors] = useState([]);
  const appStateRef = useRef("active");

  const customStyle = useSelector(state => state.chatReducer.styles);

  const [deviceList, setDeviceList, deviceRef] = useStateAndRef([],[]); const [scanning, setScanning, scanningRef] = useStateAndRef(false,false);

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

    const appStateListener = AppState.addEventListener("change",async state => {
      appStateRef.current = state;
    })

    const bluetoothListener = eventEmitter.addListener("newBTDeviceFound", device => {
      updateDeviceList(device);
    });

    const scanStateChangeListener = eventEmitter.addListener("BTStateChange", async state => {
      if(state === "DISCOVERY_STARTED" && appStateRef.current == "active") {
        setScanning(true);
      }
      else if (state === "DISCOVERY_FINISHED") {
        const servicesEnabled = await Bluetooth.checkBTEnabled() && await Bluetooth.checkLocationEnabled();
        if(servicesEnabled) {
          setScanning(false);
          setDeviceList(deviceRef.current.filter(device => device.foundAgain))
        }
      }
    })


    const bluetoothAndLocationStateListener = serviceEventEmitter.addListener("bluetoothOrLocationStateChange", state => {
      if(state === "ADAPTER_TURNED_OFF" || state === "LOCATION_DISABLED") {
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
      appStateListener.remove();
    }
  },[])

  //cancel bluetooth scan when user unfocuses this component
  useFocusEffect(useCallback(() => {
    return async () => await Bluetooth.cancelScanForDevices();
  },[]))

  const checkOrRequestConnectionServices = async () => {
    const bluetoothEnabled = await requestEnableBluetooth();

    if(!bluetoothEnabled) {
      return false;
    }

    const locationEnabled = await Bluetooth.checkLocationEnabled();

    if(!locationEnabled) {
      setShowConfirmationModal(true);
      return false;
    }
    return true;
  }

  const handleDeviceClick = async device => {
    dispatch(setLockable(false));
    const servicesEnabled = await checkOrRequestConnectionServices();
    dispatch(setLockable(true));
    if(servicesEnabled) {
      await Bluetooth.cancelScanForDevices();
      await Bluetooth.listenAsServer();
      await Bluetooth.connectAsClient(device.macAddress);
      setShowModal(true);
    }
  }

  const restartScan = async () => {
    setErrors([]);
    dispatch(setLockable(false))
    const servicesEnabled = await checkOrRequestConnectionServices();
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

      <ConfirmationModal
      visible={showConfirmationModal}
      titleText="Location needs to be enabled to perform a bluetooth scan, enable it now?"
      confirmText='Yes'
      cancelText='No'
      onConfirm={() => {
        PermissionManager.navigateToSettings(PermissionManager.navigationTargets.locationSettings)
        setShowConfirmationModal(false);
      }}
      onCancel={() => setShowConfirmationModal(false)}
      />
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
