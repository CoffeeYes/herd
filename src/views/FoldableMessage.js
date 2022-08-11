import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';

import Crypto from '../nativeWrapper/Crypto';

const FoldableMessage = ({to = "N/A", from = "N/A", timestamp, text, style, overRideOpen, textEncrypted}) => {
  const [open, setOpen] = useState(false);
  const [decryptedText, setDecryptedText] = useState("");

  useEffect(() => {
    textEncrypted ?
    Crypto.decryptString(
      "herdPersonal",
      Crypto.algorithm.RSA,
      Crypto.blockMode.ECB,
      Crypto.padding.OAEP_SHA256_MGF1Padding,
      text
    ).then(result => setDecryptedText(result))
    :
    setDecryptedText(text)
  },[])

  useEffect(() => {
    setOpen(overRideOpen)
  },[overRideOpen])

  return (
    <TouchableOpacity style={{...styles.container, paddingBottom : open ? 0 : 20}} onPress={() => setOpen(!open)}>
      {open ?
      <View style={styles.open}>
        <View style={styles.closed}>
          <Text>To: {to}</Text>
          <Text>From : {from}</Text>
          <Text>{timestamp}</Text>
        </View>
        <View style={styles.messageText}>
          <Text>{decryptedText}</Text>
        </View>
      </View>
      :
      <View style={styles.closed}>
        <Text>To: {to}</Text>
        <Text>From : {from}</Text>
        <Text>{timestamp}</Text>
      </View>}
    </TouchableOpacity>
  )
}

const styles = {
  closed : {
    flexDirection : "row",
    justifyContent : "space-between",
    width : "100%",
    paddingHorizontal : 20
  },
  messageText : {
    marginTop : 10,
    width : "100%",
    backgroundColor : "#e0e0e0",
    padding : 20,
  },
  open : {
    width : "100%"
  },
  container : {
    flexDirection : "row",
    backgroundColor : "white",
    paddingVertical : 20,
    backgroundColor : "white",
    width : Dimensions.get('window').width * 0.8,
    marginVertical : 5,
    borderRadius : 10,
    elevation : 2
  },
}

export default FoldableMessage;
