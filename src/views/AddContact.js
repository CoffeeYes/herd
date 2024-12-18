import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { View } from 'react-native';
import Bluetooth from '../nativeWrapper/Bluetooth';
import PermissionManager from '../nativeWrapper/PermissionManager';
import Header from './Header';
import Card from './Card';

import QRCodeModal from './QRCodeModal';
import PermissionModal from './PermissionModal';

import { palette } from '../assets/palette';

import { setLockable } from '../redux/actions/appStateActions';

import { useScreenAdjustedSize } from '../helper';
import { enableServicesForBluetoothScan, requestMakeDiscoverable, requestPermissionsForBluetooth } from '../common';

const AddContact = ({ navigation }) => {
  const dispatch = useDispatch();
  const [bluetoothError,setBluetoothError] = useState("");
  const [showQRCode, setShowQRCode] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [requestedPermissions, setRequestedPermissions] = useState([]);
  const [requestingPermissions, setRequestingPermissions] = useState(false);
  const publicKey = useSelector(state => state.userReducer.publicKey);

  const iconSize = useScreenAdjustedSize(0.35,0.075);

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
    setRequestingPermissions(true);
    //disable lockability so that lockscreen doesn't crop up when a modal is shown
    dispatch(setLockable(false));

    const missingPermissions = await requestPermissionsForBluetooth();
    
    if(missingPermissions.length > 0) {
      setRequestedPermissions(missingPermissions);
      setShowPermissionModal(true);
      dispatch(setLockable(true));
      setRequestingPermissions(false);
      return;
    }

    const servicesEnabled = await enableServicesForBluetoothScan();

    if(servicesEnabled) {
      let discoverable = await requestMakeDiscoverable();
      discoverable &&
      navigation.navigate("BTDeviceList");
    }
    dispatch(setLockable(true));
    setRequestingPermissions(false);
  }

  const permissionModalDescription = `Herd requires permissions in order to connect \
with other phones using bluetooth.`;

  const permissionModalInstructionText = `Please navigate to Herd's app settings and select \
'allow all the time' under for the following permissions in order to use bluetooth to add a contact.`;

  useFocusEffect(() => {
    navigating.current = false;
  })

  const navigate = (target,params) => {
    if(!navigating.current && !showQRCode && !showPermissionModal) {
      navigating.current = true;
      navigation.navigate(target,params);
    }
  }

  return (
    <>
      <Header allowGoBack disableBackButton={navigating.current || showQRCode || showPermissionModal} title="Add Contact" />

      <View style={styles.mainContainer}>
        <View style={styles.row}>

          <Card
          onPress={() => !navigating.current && !showQRCode && requestBTPermissions()}
          disabled={bluetoothError.length > 0}
          cardStyle={styles.leftCard}
          disabledStyle={styles.cardDisabled}
          errorText={bluetoothError}
          icon="bluetooth-searching"
          iconSize={iconSize}
          text="Start Bluetooth Scan"/>

          <Card
          onPress={() => navigate("editContact")}
          disabled={requestingPermissions}
          cardStyle={styles.rightCard}
          icon="import-export"
          iconSize={iconSize}
          text="Import Key"/>

        </View>

        <View style={styles.row}>

          <Card
          onPress={() => !navigating.current && !showPermissionModal && setShowQRCode(true)}
          cardStyle={styles.leftCard}
          disabled={requestingPermissions}
          icon="qr-code-2"
          iconSize={iconSize}
          text="Show My QR Code"/>

          <Card
          onPress={() => navigate("QRScanner")}
          cardStyle={styles.rightCard}
          disabled={requestingPermissions}
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
        PermissionManager.navigateToSettings(PermissionManager.navigationTargets.settings);
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
