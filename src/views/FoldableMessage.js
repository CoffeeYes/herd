import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

import Crypto from '../nativeWrapper/Crypto';

const FoldableMessage = ({to, timestamp, text, style}) => {
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
    <TouchableOpacity style={style} onPress={() => setOpen(!open)}>
      {open ?
      <View style={styles.open}>
        <View style={styles.closed}>
          <Text>To: {to}</Text>
          <Text>{timestamp}</Text>
        </View>
        <View style={styles.messageText}>
          <Text>{decryptedText}</Text>
        </View>
      </View>
      :
      <View style={styles.closed}>
        <Text>To: {to}</Text>
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
  },
  messageText : {
    marginTop : 10,
  },
}

export default FoldableMessage;
