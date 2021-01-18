import React, { useState, useEffect } from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Bluetooth from '../nativeWrapper/Bluetooth';
import Crypto from '../nativeWrapper/Crypto';

import QRCodeModal from './QRCodeModal'

const AddContact = ({ navigation }) => {
  const [BTError,setBTError] = useState("");
  const [showQRCode, setShowQRCode] = useState(false);
  const [publicKey, setPublicKey] = useState("");

  useEffect(() => {
    Crypto.loadKeyFromKeystore("herdPersonal").then(key => setPublicKey(key))
    const checkForBT = setInterval(async () => {
      let adapter = await Bluetooth.checkForBTAdapter();
      let enabled = await Bluetooth.checkBTEnabled();

      if(!adapter) {
        return setBTError("No Bluetooth Adapters Found");
      }
      else if(!enabled) {
        setBTError("Bluetooth is not enabled")
      }
      else {
        setBTError("")
      }
    },200)
    return () => clearInterval(checkForBT);
  },[])

  return (
    <>
      <View style={styles.header}>
        <Text style={{color : "white"}}>Add Contact</Text>
      </View>
      <View style={styles.mainContainer}>
        <View style={styles.row}>

          <TouchableOpacity
          onPress={() => navigation.navigate("BTDeviceList")}
          style={!!BTError ? {...styles.card,...styles.cardDisabled }: {...styles.card,...styles.leftCard}}
          disabled={!!BTError}>
            {!!BTError && <Text style={styles.error}>{BTError}</Text>}
            <Icon name="bluetooth-searching" size={120}/>
            <Text style={styles.cardText}>Start Bluetooth Scan </Text>
          </TouchableOpacity>

          <TouchableOpacity
          style={{...styles.card,...styles.rightCard}}
          onPress={() => navigation.navigate("createcontact")}>
            <Icon name="import-export" size={120}/>
            <Text style={styles.cardText}>Import Key </Text>
          </TouchableOpacity>

        </View>

        <View style={styles.row}>

          <TouchableOpacity
          onPress={() => setShowQRCode(true)}
          style={{...styles.card,...styles.leftCard}}>
            <Icon name="qr-code-2" size={120}/>
            <Text style={styles.cardText}>Show My QR Code</Text>
          </TouchableOpacity>

          <TouchableOpacity
          onPress={() => navigation.navigate("QRScanner")}
          style={{...styles.card,...styles.rightCard}}>
            <Icon name="qr-code-scanner" size={120}/>
            <Text style={styles.cardText}>Scan QR Code</Text>
          </TouchableOpacity>

        </View>

      </View>
        <QRCodeModal
        visible={showQRCode}
        setVisible={setShowQRCode}
        text={publicKey}/>
    </>
  )
}

const styles = {
  header : {
    backgroundColor : "#E86252",
    padding : 15
  },
  mainContainer : {
    padding : 20,
    flex : 1
  },
  error : {
    color : "red",
    fontWeight : "bold",
    textAlign : "center",
    fontSize : 18
  },
  card : {
    padding : 20,
    flex : 1,
    backgroundColor : "white",
    borderRadius : 5,
    alignItems : "center",
    justifyContent : "center"
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
  cardText : {
    color : "black",
    marginTop : 10
  },
  row : {
    flexDirection : "row",
    marginTop : 10,
    flex : 1
  }
}

export default AddContact;
