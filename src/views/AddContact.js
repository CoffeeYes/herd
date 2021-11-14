import React, { useState, useEffect } from 'react';
import { Text, View, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Bluetooth from '../nativeWrapper/Bluetooth';
import Crypto from '../nativeWrapper/Crypto';
import Header from './Header';
import Card from './Card'

import QRCodeModal from './QRCodeModal'

const AddContact = ({ navigation }) => {
  const [BTError,setBTError] = useState("");
  const [showQRCode, setShowQRCode] = useState(false);
  const [publicKey, setPublicKey] = useState("");

  useEffect(() => {
    Crypto.loadKeyFromKeystore("herdPersonal").then(key => setPublicKey(key))

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
    if(!btEnabled) {
      await Bluetooth.requestBTEnable()
    }
    if (!locationAllowed) {
      const locationRequest = Bluetooth.requestLocationPermissions();
      if(!locationAllowed) { return setBTError("You must enable location permissions for Herd in settings")}
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

    // const locationAllowed = await Bluetooth.checkLocationPermission();
    // if(!locationAllowed) {
    //   Bluetooth.requestLocationPermissions();
    // }
  }

  return (
    <>
      <Header allowGoBack title="Add Contact" />

      <View style={styles.mainContainer}>
        <View style={styles.row}>

          <Card
          onPress={requestBTPermissions}
          disabled={!!BTError}
          cardStyle={!!BTError ?
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
      setVisible={setShowQRCode}
      title="My Key"
      value={{key : publicKey}}/>
    </>
  )
}

const styles = {
  mainContainer : {
    padding : 20,
    flex : 1
  },
  cardDisabled : {
    backgroundColor : "grey"
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
