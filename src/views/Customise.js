import React, { useState } from 'react';
import { ScrollView, View, Text, Dimensions } from 'react-native';
import { ColorPicker, fromHsv, toHsv } from 'react-native-color-picker';
import ColorChoice from './ColorChoice'

const Customise = ({ }) => {
  const [sentBoxColor, setSentBoxColor] = useState("");
  const [sentTextColor, setSentTextColor] = useState("");
  const [receivedBoxColor, setReceivedBoxColor] = useState("");
  const [receivedTextColor, setReceivedTextColor] = useState("");

  return (
    <ScrollView>
      <View style={styles.messagesContainer}>
        <View
        style={{...styles.message,...styles.messageFromYou, backgroundColor : sentBoxColor}}>
          <Text style={{...styles.messageText, color : sentTextColor || "black"}}>Hello</Text>
          <Text style={styles.timestamp}>12:20 - 15.01</Text>
        </View>

        <View
        style={{...styles.message,...styles.messageFromOther, backgroundColor : receivedBoxColor}}>
          <Text style={{...styles.messageText,color : receivedTextColor || "black"}}>Goodbye</Text>
          <Text style={styles.timestamp}>12:21 - 15.01</Text>
        </View>
      </View>

      <ColorChoice
        title={"Sent Box Color"}
        color={sentBoxColor}
        setColor={setSentBoxColor}
      />
      <ColorChoice
        title={"Sent Text Color"}
        color={sentTextColor}
        setColor={setSentTextColor}
      />
      <ColorChoice
        title={"Received Box Color"}
        color={receivedBoxColor}
        setColor={setReceivedBoxColor}
      />
      <ColorChoice
        title={"Received Text Color"}
        color={receivedTextColor}
        setColor={setReceivedTextColor}
      />

    </ScrollView>
  )
}

const styles = {
  messageFromOther : {
    backgroundColor : "#E86252",
    marginLeft : 5
  },
  messageFromYou : {
    backgroundColor : "#c6c6c6",
    alignSelf : "flex-end",
    marginRight : 5
  },
  message : {
    padding : 20,
    width : "50%",
    marginVertical : 5,
    borderRadius : 10,
  },
  messagesContainer : {
    flex : 1
  },
  colorPickerContainer : {
    alignItems : "center"
  },
  colorPicker : {
    width : Dimensions.get("window").width * 0.8,
    height : Dimensions.get("window").height * 0.5
  }
}
export default Customise;
