import Bluetooth from './nativeWrapper/Bluetooth';
import { Alert } from 'react-native';

const requestPermissionsForBluetooth = async () => {
  let permissionsNotGranted = [];
  const locationAllowed = await Bluetooth.checkLocationPermission();
  if(!locationAllowed) {
    const locationRequest = await Bluetooth.requestLocationPermissions();
    if(!locationRequest) {
      permissionsNotGranted.push("Location")
    }
  }

  const bluetoothScanPermissionsGranted = await Bluetooth.checkBTPermissions();

  if(!bluetoothScanPermissionsGranted) {
    const grantBluetoothScanPermissions = await Bluetooth.requestBTPermissions();
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

export {
  requestPermissionsForBluetooth,
  requestEnableBluetooth,
  requestEnableLocation
}
