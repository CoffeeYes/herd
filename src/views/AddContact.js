import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Text, View, TouchableOpacity, Alert, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Bluetooth from '../nativeWrapper/Bluetooth';
import Crypto from '../nativeWrapper/Crypto';
import Header from './Header';
import Card from './Card';

import QRCodeModal from './QRCodeModal';
import PermissionModal from './PermissionModal';

import { palette } from '../assets/palette';

import { setLockable } from '../redux/actions/appStateActions';

import { useScreenAdjustedSize } from '../helper';

const AddContact = ({ navigation }) => {
  const dispatch = useDispatch();
  const [BTError,setBTError] = useState("");
  const [showQRCode, setShowQRCode] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [requestedPermissions, setRequestedPermissions] = useState([]);
  const publicKey = useSelector(state => state.userReducer.publicKey);

  const iconSize = useScreenAdjustedSize(0.35,0.1);

  useEffect(() => {
    initialBTCheck();
  },[])

  const initialBTCheck = async () => {
    let adapter = await Bluetooth.checkForBTAdapter();

    if(!adapter) {
      return setBTError("No Bluetooth Adapters Found");
    }
  }

  const requestBTPermissions = async () => {
    setBTError("");
    setRequestedPermissions([]);
    //disable lockability so that lockscreen doesn't crop up when a modal is shown
    dispatch(setLockable(false));
    let currentRequestedPermissions = [];
    const locationAllowed = await Bluetooth.checkLocationPermission();
    if(!locationAllowed) {
      const locationRequest = await Bluetooth.requestLocationPermissions();
      if(!locationRequest) {
        currentRequestedPermissions.push("Location")
      }
    }

    const btPermissionsGranted = await Bluetooth.requestBTPermissions();
    if (!btPermissionsGranted) {
      currentRequestedPermissions.push("Nearby-devices")
    }

    if(currentRequestedPermissions.length > 0) {
      setRequestedPermissions(currentRequestedPermissions);
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
      await Bluetooth.requestBTMakeDiscoverable(60) &&
      navigation.navigate("BTDeviceList");
    }
    dispatch(setLockable(true));
  }

  const permissionModalDescription = `Herd requires permissions in order to connect \
with other phones using bluetooth.`;

  const permissionModalInstructionText = `Please navigate to Herd's app settings and select \
'allow all the time' under for the following permissions in order to use bluetooth to add a contact.`;

  return (
    <>
      <Header allowGoBack title="Add Contact" />

      <View style={styles.mainContainer}>
        <View style={styles.row}>

          <Card
          onPress={requestBTPermissions}
          disabled={BTError.length > 0}
          cardStyle={BTError.length > 0 ?
            styles.cardDisabled
            :
            styles.leftCard
          }
          errorText={BTError}
          icon="bluetooth-searching"
          iconSize={iconSize}
          text="Start Bluetooth Scan"/>

          <Card
          onPress={() => navigation.navigate("editContact")}
          cardStyle={styles.rightCard}
          icon="import-export"
          iconSize={iconSize}
          text="Import Key"/>

        </View>

        <View style={styles.row}>

          <Card
          onPress={() => setShowQRCode(true)}
          cardStyle={styles.leftCard}
          icon="qr-code-2"
          iconSize={iconSize}
          text="Show My QR Code"/>

          <Card
          onPress={() => navigation.navigate("QRScanner")}
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
      icon="location-on"
      visible={showPermissionModal}
      modalOnPress={() => setShowPermissionModal(false)}
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
