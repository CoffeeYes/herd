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

const requestMakeDiscoverable = async (discoverableDuration = 30) => {
  let discoverable = await Bluetooth.checkBTDiscoverable();
  if(!discoverable) {
    discoverable = await Bluetooth.requestBTMakeDiscoverable(discoverableDuration);
  }
  return discoverable;
}

const checkOrRequestConnectionServices = async () => {
    const bluetoothEnabled = await requestEnableBluetooth();

    if(!bluetoothEnabled) {
      return {enabled : false, missing : "bluetooth"};
    }

    const locationEnabled = await Bluetooth.checkLocationEnabled();

    if(!locationEnabled) {
      return {enabled : false, missing : "location"};
    }
    return {enabled : true};
}

const cryptographySettings = [
  Crypto.algorithm.RSA,
  Crypto.blockMode.ECB,
  Crypto.padding.OAEP_SHA256_MGF1Padding,
]

const decryptStrings = async strings => {
  const decryptedStrings = await Crypto.decryptStrings(
    "herdPersonal",
    ...cryptographySettings,
    strings
  )
  return decryptedStrings;
}

const decryptStringsWithIdentifier = async strings => {
  const decryptedStrings = await Crypto.decryptStringsWithIdentifier(
    "herdPersonal",
    ...cryptographySettings,
    strings
  )
  return decryptedStrings;
}

const encryptStrings = async (keyOrAlias, loadKeyFromStore, strings) => {
  const encryptedStrings = await Crypto.encryptStrings(
    keyOrAlias,
    loadKeyFromStore,
    ...cryptographySettings,
    strings
  )
  return encryptedStrings
}

const storeChatHasNewMessages = async (chatID, hasNewMessages) => {
  let chatsWithNewMessages = JSON.parse(await AsyncStorage.getItem(STORAGE_STRINGS.CHATS_WITH_NEW_MESSAGES)) || [];
  chatsWithNewMessages = hasNewMessages ? [...chatsWithNewMessages,chatID] : chatsWithNewMessages.filter(chat => chat != chatID);
  AsyncStorage.setItem(STORAGE_STRINGS.CHATS_WITH_NEW_MESSAGES,JSON.stringify(chatsWithNewMessages));
}

const storeChatsWithNewMessages = async chats => {
  let chatsWithNewMessages = JSON.parse(await AsyncStorage.getItem(STORAGE_STRINGS.CHATS_WITH_NEW_MESSAGES)) || [];
  const newChatsToAdd = chats.filter(chat => chat.hasNewMessages).map(chat => chat._id);
  chatsWithNewMessages = [...newChatsToAdd,chatsWithNewMessages];
  //unique instances only
  chatsWithNewMessages = [...new Set(chatsWithNewMessages)];
  AsyncStorage.setItem(STORAGE_STRINGS.CHATS_WITH_NEW_MESSAGES,JSON.stringify(chatsWithNewMessages));
}

const loadChatsWithNewMessages = async chats => {
  const chatsWithNewMessages = JSON.parse(await AsyncStorage.getItem(STORAGE_STRINGS.CHATS_WITH_NEW_MESSAGES)) || [];
  for(let chat of chats) {
    if (chatsWithNewMessages.includes(chat._id)) {
      chat.hasNewMessages = true;
    }
  }
  return chats;
}

const STORAGE_STRINGS = {
  MAX_PASSWORD_ATTEMPTS : "maxPasswordAttempts",
  PASSWORD_ATTEMPT_COUNT : "passwordAttemptCount",
  STYLES : "styles",
  ENABLE_NOTIFICATIONS : "enableNotifications",
  CHATS_WITH_NEW_MESSAGES : "chatsWithNewMessages",
  SETUP_COMPLETE : "setupComplete"
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
  loadChatsWithNewMessages,
  STORAGE_STRINGS
}
