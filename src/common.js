import Bluetooth from './nativeWrapper/Bluetooth';
import Crypto from './nativeWrapper/Crypto';
import PermissionManager from './nativeWrapper/PermissionManager';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

const checkOrRequestConnectionServices = async (onLocationDisabled = () => {}) => {
    const bluetoothEnabled = await requestEnableBluetooth();

    if(!bluetoothEnabled) {
      return false;
    }

    const locationEnabled = await Bluetooth.checkLocationEnabled();

    if(!locationEnabled) {
      onLocationDisabled();
      return false;
    }
    return true;
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

const chatsWithNewMessagesStorageString = "chatsWithNewMessages";

const storeChatHasNewMessages = async (chatID, hasNewMessages) => {
  let chatsWithNewMessages = JSON.parse(await AsyncStorage.getItem(chatsWithNewMessagesStorageString)) || [];
  chatsWithNewMessages = hasNewMessages ? [...chatsWithNewMessages,chatID] : chatsWithNewMessages.filter(chat => chat != chatID);
  AsyncStorage.setItem(chatsWithNewMessagesStorageString,JSON.stringify(chatsWithNewMessages));
}

const storeChatsWithNewMessages = async chats => {
  let chatsWithNewMessages = JSON.parse(await AsyncStorage.getItem(chatsWithNewMessagesStorageString)) || [];
  const newChatsToAdd = chats.filter(chat => chat.hasNewMessages).map(chat => chat._id);
  chatsWithNewMessages = [...newChatsToAdd,chatsWithNewMessages];
  //unique instances only
  chatsWithNewMessages = [...new Set(chatsWithNewMessages)];
  AsyncStorage.setItem(chatsWithNewMessagesStorageString,JSON.stringify(chatsWithNewMessages));
}

const loadChatsWithNewMessages = async chats => {
  chatsWithNewMessages = JSON.parse(await AsyncStorage.getItem(chatsWithNewMessagesStorageString)) || [];
  for(let chat of chats) {
    if (chatsWithNewMessages.includes(chat._id)) {
      chat.hasNewMessages = true;
    }
  }
  return chats;
}

export {
  requestPermissionsForBluetooth,
  requestEnableBluetooth,
  requestMakeDiscoverable,
  checkOrRequestConnectionServices,
  decryptStrings,
  decryptStringsWithIdentifier,
  encryptStrings,
  storeChatHasNewMessages,
  storeChatsWithNewMessages,
  loadChatsWithNewMessages
}
