import React, { useState, useEffect } from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import Bluetooth from '../nativeWrapper/Bluetooth';
import Crypto from '../nativeWrapper/Crypto';

import QRCodeModal from './QRCodeModal'

const AddContact = ({ navigation }) => {
  const [error,setError] = useState("");
  const [showQRCode, setShowQRCode] = useState(false);
  const [publicKey, setPublicKey] = useState("");

  useEffect(() => {
    Crypto.loadKeyFromKeystore("herdPersonal").then(key => setPublicKey(key))
    const checkForBT = setInterval(async () => {
      let adapter = await Bluetooth.checkForBTAdapter();
      let enabled = await Bluetooth.checkBTEnabled();

      if(!adapter) {
        return setError("No Bluetooth Adapters Found");
      }
      else if(!enabled) {
        setError("Bluetooth is not enabled")
      }
      else {
        setError("")
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
          style={{...styles.card,...styles.leftCard}}
          disabled={!!error}>
            <Text style={styles.cardText}>Start Scanning </Text>
          </TouchableOpacity>

          <TouchableOpacity
          style={{...styles.card,...styles.rightCard}}
          onPress={() => navigation.navigate("createcontact")}>
            <Text style={styles.cardText}>Import Key </Text>
          </TouchableOpacity>

        </View>

        <View style={styles.row}>

          <TouchableOpacity
          onPress={() => setShowQRCode(true)}
          style={{...styles.card,...styles.leftCard}}>
            <Text style={styles.cardText}>Show My QR Code</Text>
          </TouchableOpacity>

          <TouchableOpacity
          onPress={() => navigation.navigate("QRScanner")}
          style={{...styles.card,...styles.rightCard}}>
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
    alignItems : "center"
  },
  leftCard : {
    marginRight : 5
  },
  rightCard : {
    marginLeft : 5
  },
  cardText : {
    color : "black"
  },
  row : {
    flexDirection : "row",
    marginTop : 10,
    flex : 1
  }
}

export default AddContact;
