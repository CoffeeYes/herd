import Bluetooth from './nativeWrapper/Bluetooth';
import Crypto from './nativeWrapper/Crypto';
import PermissionManager from './nativeWrapper/PermissionManager';

import { Alert } from 'react-native';

const requestPermissionsForBluetooth = async () => {
  let permissionsNotGranted = [];
  const locationAllowed = await PermissionManager.checkLocationPermission();
  if(!locationAllowed) {
    const locationRequest = await PermissionManager.requestLocationPermissions();
    if(!locationRequest) {
      permissionsNotGranted.push("Location")
    }
  }

  const bluetoothScanPermissionsGranted = await PermissionManager.checkBTPermissions();

  if(!bluetoothScanPermissionsGranted) {
    const grantBluetoothScanPermissions = await PermissionManager.requestBTPermissions();
    if(!grantBluetoothScanPermissions) {
      permissionsNotGranted.push("Nearby-devices");
    }
  }
  return permissionsNotGranted;
}

const requestEnableBluetooth = async () => {
  let bluetoothEnabled = await Bluetooth.checkBTEnabled();
  if(!bluetoothEnabled) {
    bluetoothEnabled = await Bluetooth.requestBTEnable();
  }
  return bluetoothEnabled;
}

const requestEnableLocation = async () => {
  let locationEnabled = await Bluetooth.checkLocationEnabled();
  if(!locationEnabled) {
    Alert.alert(
      "Location",
      "Location is required to run in the background, enable it now?",
      [
        {text : "No"},
        {text : "Yes", onPress : async () => locationEnabled = await Bluetooth.requestLocationEnable()}
      ]
    )
  }
  return locationEnabled;
}

const decryptStrings = async strings => {
  const decryptedStrings = await Crypto.decryptStrings(
    "herdPersonal",
    Crypto.algorithm.RSA,
    Crypto.blockMode.ECB,
    Crypto.padding.OAEP_SHA256_MGF1Padding,
    strings
  )
  return decryptedStrings;
}

const decryptStringsWithIdentifier = async strings => {
  const decryptedStrings = await Crypto.decryptStringsWithIdentifier(
    "herdPersonal",
    Crypto.algorithm.RSA,
    Crypto.blockMode.ECB,
    Crypto.padding.OAEP_SHA256_MGF1Padding,
    strings
  )
  return decryptedStrings;
}

const encryptStrings = async (keyOrAlias, loadKeyFromStore, strings) => {
  const encryptedStrings = await Crypto.encryptStrings(
    keyOrAlias,
    loadKeyFromStore,
    Crypto.algorithm.RSA,
    Crypto.blockMode.ECB,
    Crypto.padding.OAEP_SHA256_MGF1Padding,
    strings
  )
  return encryptedStrings
}

export {
  requestPermissionsForBluetooth,
  requestEnableBluetooth,
  requestEnableLocation,
  decryptStrings,
  decryptStringsWithIdentifier,
  encryptStrings
}
