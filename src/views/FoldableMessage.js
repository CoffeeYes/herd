import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

const FoldableMessage = ({to, timestamp, text}) => {
  const [open, setOpen] = useState(false);

  return (
    <TouchableOpacity style={styles.closed} onPress={() => setOpen(!open)}>
      {open ?
      <View style={styles.open}>
        <View style={styles.closed}>
          <Text>To: {to}</Text>
          <Text>{timestamp}</Text>
        </View>
        <View>
          <Text>{text}</Text>
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
  }
}

export default FoldableMessage;
