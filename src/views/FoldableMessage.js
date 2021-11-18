import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

import Crypto from '../nativeWrapper/Crypto';

const FoldableMessage = ({to, from, timestamp, text, style}) => {
  const [open, setOpen] = useState(false);
  const [decryptedText, setDecryptedText] = useState("");

  useEffect(() => {
    Crypto.decryptString(
      "herdPersonal",
      Crypto.algorithm.RSA,
      Crypto.blockMode.ECB,
      Crypto.padding.OAEP_SHA256_MGF1Padding,
      text
    ).then(result => setDecryptedText(result))
  },[])

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
    borderBottomWidth : 1,
    borderBottomColor : "black"
  },
  open : {
    width : "100%"
  },
  container : {
    flexDirection : "row",
    backgroundColor : "white",
    borderBottomWidth : 1,
    borderBottomColor : "black",
    paddingVertical : 20,
    backgroundColor : "white",
  },
}

export default FoldableMessage;
