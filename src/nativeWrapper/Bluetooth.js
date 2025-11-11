import { NativeModules, requireNativeComponent, ViewStyle } from 'react-native';

const { BluetoothModule } = NativeModules;

const scanForBLEDevices = BluetoothModule.scanForBLEDevices;

BluetoothModule.scanForBLEDevices = (scanDuration=30000) => {
  scanForBLEDevices(scanDuration)
}

export default BluetoothModule;
