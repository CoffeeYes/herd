import Bluetooth from './nativeWrapper/Bluetooth';
import Crypto from './nativeWrapper/Crypto';
import PermissionManager from './nativeWrapper/PermissionManager';

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

const requestMakeDiscoverable = async () => {
  let discoverable = await Bluetooth.checkBTDiscoverable();
  if(!discoverable) {
    discoverable = await Bluetooth.requestBTMakeDiscoverable(30);
  }
  return discoverable;
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
  requestMakeDiscoverable,
  decryptStrings,
  decryptStringsWithIdentifier,
  encryptStrings
}
