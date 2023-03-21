import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Text, View, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Bluetooth from '../nativeWrapper/Bluetooth';
import Crypto from '../nativeWrapper/Crypto';
import Header from './Header';
import Card from './Card';

import QRCodeModal from './QRCodeModal';
import LocationModal from './LocationModal';

import { palette } from '../assets/palette';

import { setLockable } from '../redux/actions/appStateActions';

const AddContact = ({ navigation }) => {
  const dispatch = useDispatch();
  const [BTError,setBTError] = useState("");
  const [showQRCode, setShowQRCode] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const publicKey = useSelector(state => state.userReducer.publicKey);

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
    const btEnabled = await Bluetooth.checkBTEnabled();
    const locationAllowed = await Bluetooth.checkLocationPermission();
    const locationEnabled = await Bluetooth.checkLocationEnabled();
    dispatch(setLockable(false));
    if(!btEnabled) {
      await Bluetooth.requestBTEnable()
    }
    if (!locationAllowed) {
      const locationRequest = await Bluetooth.requestLocationPermissions();
      if(!locationRequest) {
        setShowLocationModal(true);
        dispatch(setLockable(true));
        return;
      }
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

  const locationModalDescription = `Herd requires location permissions in order to connect \
with other phones using bluetooth.`;

  const locationModalInstructionText = `Please navigate to Herd's app settings and select \
'allow all the time' under location permissions in order to use bluetooth to add a contact.`;

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
          iconSize={120}
          text="Start Bluetooth Scan"/>

          <Card
          onPress={() => navigation.navigate("createcontact")}
          cardStyle={styles.rightCard}
          icon="import-export"
          iconSize={120}
          text="Import Key"/>

        </View>

        <View style={styles.row}>

          <Card
          onPress={() => setShowQRCode(true)}
          cardStyle={styles.leftCard}
          icon="qr-code-2"
          iconSize={120}
          text="Show My QR Code"/>

          <Card
          onPress={() => navigation.navigate("QRScanner")}
          cardStyle={styles.rightCard}
          icon="qr-code-scanner"
          iconSize={120}
          text="Scan QR Code"/>

        </View>

      </View>
      <QRCodeModal
      visible={showQRCode}
      onPress={() => setShowQRCode(false)}
      onRequestClose={() => setShowQRCode(false)}
      title="My Key"
      value={{key : publicKey}}/>

      <LocationModal
      visible={showLocationModal}
      modalOnPress={() => setShowLocationModal(false)}
      onRequestClose={() => setShowLocationModal(false)}
      buttonOnPress={() => {
        setShowLocationModal(false);
        Bluetooth.navigateToApplicationSettings();
      }}
      description={locationModalDescription}
      instructionText={locationModalInstructionText}/>
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
  }
}

export default AddContact;
