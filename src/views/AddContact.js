import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useIsFocused } from '@react-navigation/native';
import { View, Alert } from 'react-native';
import Bluetooth from '../nativeWrapper/Bluetooth';
import Header from './Header';
import Card from './Card';

import QRCodeModal from './QRCodeModal';
import PermissionModal from './PermissionModal';

import { palette } from '../assets/palette';

import { setLockable } from '../redux/actions/appStateActions';

import { useScreenAdjustedSize } from '../helper';
import { requestPermissionsForBluetooth } from '../common';

const AddContact = ({ navigation }) => {
  const dispatch = useDispatch();
  const [bluetoothError,setBluetoothError] = useState("");
  const [showQRCode, setShowQRCode] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [requestedPermissions, setRequestedPermissions] = useState([]);
  const publicKey = useSelector(state => state.userReducer.publicKey);

  const iconSize = useScreenAdjustedSize(0.35,0.075);

  const isFocused = useIsFocused();
  const navigating = useRef(false);

  useEffect(() => {
    initialBTCheck();
  },[])

  const initialBTCheck = async () => {
    let adapter = await Bluetooth.checkForBTAdapter();

    if(!adapter) {
      return setBluetoothError("No Bluetooth Adapters Found");
    }
  }

  const requestBTPermissions = async () => {
    setBluetoothError("");
    setRequestedPermissions([]);
    //disable lockability so that lockscreen doesn't crop up when a modal is shown
    dispatch(setLockable(false));

    const missingPermissions = await requestPermissionsForBluetooth();
    
    if(missingPermissions.length > 0) {
      setRequestedPermissions(missingPermissions);
      setShowPermissionModal(true);
      dispatch(setLockable(true));
      return;
    }

    const btEnabled = await Bluetooth.checkBTEnabled();
    const locationEnabled = await Bluetooth.checkLocationEnabled();
    if(!btEnabled) {
      await Bluetooth.requestBTEnable()
    }

    if (!locationEnabled) {
      Alert.alert(
        "Location",
        "Location is required to run in the background, enable it now?",
        [
          {text : "No"},
          {text : "Yes", onPress : async () => await Bluetooth.requestLocationEnable()}
        ]
      )
    }
    else {
      let discoverable = await Bluetooth.checkBTDiscoverable();
      if(!discoverable) {
        discoverable = await Bluetooth.requestBTMakeDiscoverable(30);
      }

      discoverable &&
      navigation.navigate("BTDeviceList");
    }
    dispatch(setLockable(true));
  }

  const permissionModalDescription = `Herd requires permissions in order to connect \
with other phones using bluetooth.`;

  const permissionModalInstructionText = `Please navigate to Herd's app settings and select \
'allow all the time' under for the following permissions in order to use bluetooth to add a contact.`;

  useEffect(() => {
    if(isFocused) {
      navigating.current = false;
    }
  },[isFocused])

  const navigate = (target,params) => {
    if(!navigating.current && !showQRCode && !showPermissionModal) {
      navigating.current = true;
      navigation.navigate(target,params);
    }
  }

  return (
    <>
      <Header allowGoBack title="Add Contact" />

      <View style={styles.mainContainer}>
        <View style={styles.row}>

          <Card
          onPress={() => !navigating.current && requestBTPermissions()}
          disabled={bluetoothError.length > 0}
          cardStyle={styles.leftCard}
          disabledStyle={styles.cardDisabled}
          errorText={bluetoothError}
          icon="bluetooth-searching"
          iconSize={iconSize}
          text="Start Bluetooth Scan"/>

          <Card
          onPress={() => navigate("editContact")}
          cardStyle={styles.rightCard}
          icon="import-export"
          iconSize={iconSize}
          text="Import Key"/>

        </View>

        <View style={styles.row}>

          <Card
          onPress={() => !navigating.current && setShowQRCode(true)}
          cardStyle={styles.leftCard}
          icon="qr-code-2"
          iconSize={iconSize}
          text="Show My QR Code"/>

          <Card
          onPress={() => navigate("QRScanner")}
          cardStyle={styles.rightCard}
          icon="qr-code-scanner"
          iconSize={iconSize}
          text="Scan QR Code"/>

        </View>

      </View>
      <QRCodeModal
      visible={showQRCode}
      onPress={() => setShowQRCode(false)}
      onRequestClose={() => setShowQRCode(false)}
      title="My Key"
      value={{key : publicKey}}/>

      <PermissionModal
      useCloseButton
      disableOnPress
      icon="location-on"
      visible={showPermissionModal}
      onRequestClose={() => setShowPermissionModal(false)}
      buttonOnPress={() => {
        setShowPermissionModal(false);
        Bluetooth.navigateToApplicationSettings();
      }}
      permissions={requestedPermissions}
      description={permissionModalDescription}
      instructionText={permissionModalInstructionText}/>
    </>
  )
}

const styles = {
  mainContainer : {
    padding : 20,
    flex : 1
  },
  cardDisabled : {
    backgroundColor : palette.grey
  },
  leftCard : {
    marginRight : 5
  },
  rightCard : {
    marginLeft : 5
  },
  row : {
    flexDirection : "row",
    marginTop : 10,
    flex : 1
  },
  modalContent : {
    backgroundColor : palette.white
  }
}

export default AddContact;
