import React, { useState, useEffect,  useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Text, View, ScrollView, TouchableOpacity, 
  NativeEventEmitter, AppState, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Bluetooth from '../nativeWrapper/Bluetooth';
import ServiceInterface from '../nativeWrapper/ServiceInterface';
import PermissionManager from '../nativeWrapper/PermissionManager';
import EventEmitter from '../nativeWrapper/EventEmitter';

import BTExchangeModal from './BTExchangeModal';
import Header from './Header';
import CustomButton from './CustomButton';
import ConfirmationModal from './ConfirmationModal';

import { palette } from '../assets/palette';
import { useStateAndRef } from '../helper';
import { checkOrRequestConnectionServices} from '../common';
import { setLockable } from '../redux/actions/appStateActions';
import LoadingIndicator from './LoadingIndicator';

const BTDeviceList = ({ navigation }) => {
  const dispatch = useDispatch();
  const [showModal, setShowModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [errors, setErrors] = useState([]);
  const appStateRef = useRef("active");

  const customStyle = useSelector(state => state.appStateReducer.styles);

  const [deviceList, setDeviceList, deviceListRef] = useStateAndRef([],[]);
  const [scanning, setScanning, scanningRef] = useStateAndRef(false,false);

  const activeScanDeviceList = useRef([]);

  const bluetoothLocationErrors  = {
    [ServiceInterface.bluetoothErrors.ADAPTER_TURNED_OFF] : {
      type : "bluetooth_not_enabled",
      text : "Bluetooth was turned off"
    },
    [ServiceInterface.bluetoothErrors.LOCATION_DISABLED] : {
      type : "location_not_enabled",
      text : "Location was turned off"
    }
  }

  useEffect(() => {
    const eventEmitter = new NativeEventEmitter(Platform.OS == "ios" ? EventEmitter : Bluetooth);
    const serviceEventEmitter = new NativeEventEmitter(Platform.OS == "ios" ? EventEmitter : ServiceInterface);

    const appStateListener = AppState.addEventListener("change",async state => {
      appStateRef.current = state;
    })

    const bluetoothListener = eventEmitter.addListener(Bluetooth.emitterStrings.NEW_BT_DEVICE, device => {
      if(!activeScanDeviceList.current.find(existingDevice => existingDevice.macAddress == device.identifier)) {
        activeScanDeviceList.current.push(device);
      }
      if(!deviceListRef.current.find(existingDevice => existingDevice.macAddress == device.identifier)) {
        setDeviceList([...deviceListRef.current,device]);
      }
    });

    const scanStateChangeListener = eventEmitter.addListener(Bluetooth.emitterStrings.DISCOVERY_STATE_CHANGE, async state => {
      if(state === Bluetooth.discoveryEvents.DISCOVERY_STARTED && appStateRef.current == "active") {
        setScanning(true);
        activeScanDeviceList.current = [];
      }
      else if (state === Bluetooth.discoveryEvents.DISCOVERY_FINISHED) {
        const servicesEnabled = await Bluetooth.checkBTEnabled() && await Bluetooth.checkLocationEnabled();
        if(servicesEnabled) {
          setScanning(false);
          setDeviceList(activeScanDeviceList.current);
        }
      }
    })


    const bluetoothAndLocationStateListener = serviceEventEmitter.addListener(ServiceInterface.emitterStrings.BLUETOOTH_LOCATION_STATE_CHANGE, state => {
      if(Object.keys(bluetoothLocationErrors).includes(state)) {
        if(scanningRef.current) {
          setErrors([bluetoothLocationErrors[state]]);
        }
        Bluetooth.cancelScanForBLEDevices();
        setScanning(false);
      }
    })

    Bluetooth.scanForBLEDevices()

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
    return async () => await Bluetooth.cancelScanForBLEDevices();
  },[]))

  const handleDeviceClick = async device => {
    dispatch(setLockable(false));
    const services = await checkOrRequestConnectionServices();
    dispatch(setLockable(true));
    if(services.enabled) {
      await Bluetooth.cancelScanForBLEDevices();
      await Bluetooth.connectToBLEPeripheral(device.identifier);
      setShowModal(true);
    }
    else if(services.missing == "location") {
      setShowConfirmationModal(true);
    }
  }

  const restartScan = async () => {
    setErrors([]);
    dispatch(setLockable(false))
    const services = await checkOrRequestConnectionServices();
    if(services.enabled) {
      await Bluetooth.scanForBLEDevices();
    }
    else if(services.missing == "location") {
      setShowConfirmationModal(true);
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
          <LoadingIndicator animating={scanning}/>
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
            key={device.identifier}
            style={styles.deviceContainer}
            onPress={ () => handleDeviceClick(device)}>
              <Text style={{fontSize : customStyle.scaledUIFontSize}}>{device.name || "Nameless Device"}</Text>
              <Text style={{fontSize : customStyle.scaledUIFontSize}}>{device.identifier}</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        <CustomButton
        text={scanning ? "Cancel Scan" : "Re-Scan"}
        onPress={async () => scanning ? await Bluetooth.cancelScanForBLEDevices() : await restartScan()}
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
