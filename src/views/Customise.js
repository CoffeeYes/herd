import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, Dimensions, TouchableOpacity } from 'react-native';
import { ColorPicker, fromHsv, toHsv } from 'react-native-color-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ColorChoice from './ColorChoice';
import Header from './Header';

const Customise = ({ }) => {
  const [sentBoxColor, setSentBoxColor] = useState("");
  const [sentTextColor, setSentTextColor] = useState("");
  const [receivedBoxColor, setReceivedBoxColor] = useState("");
  const [receivedTextColor, setReceivedTextColor] = useState("");
  const [activeItem, setActiveItem] = useState("sentBox");
  const [tabWidth, setTabWidth] = useState(0);

  useEffect(() => {
    loadStyles();
  },[])

  const loadStyles = async () => {
    const styles = JSON.parse(await AsyncStorage.getItem("styles"));

    if(styles) {
      setSentBoxColor(styles.sentBoxColor);
      setSentTextColor(styles.sentTextColor);
      setReceivedBoxColor(styles.receivedBoxColor);
      setReceivedTextColor(styles.receivedTextColor);
    }
  }

  const saveStyles = async () => {
    const style = {
      sentBoxColor : sentBoxColor,
      sentTextColor : sentTextColor,
      receivedBoxColor : receivedBoxColor,
      receivedTextColor : receivedTextColor
    }

    await AsyncStorage.setItem("styles",JSON.stringify(style))
  }

  return (
    <ScrollView>
      <Header title="Customise" allowGoBack/>

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

      <TouchableOpacity
      style={{...styles.button,marginBottom : 10}}
      onPress={saveStyles}>
        <Text style={styles.buttonText}>Save</Text>
      </TouchableOpacity>

      <View style={styles.colorChoiceContainer}>
        <View style={styles.tabRow} onLayout={e => setTabWidth(e.nativeEvent.layout.width / 4)}>
          <TouchableOpacity
          style={{...styles.tabItem,width : tabWidth,backgroundColor : activeItem === "sentBox" ? "#EBB3A9" : "white"}}
          onPress={() => setActiveItem("sentBox")}>
            <Text style={styles.tabText}>Sent Box</Text>
          </TouchableOpacity>
          <TouchableOpacity
          style={{...styles.tabItem,width : tabWidth,backgroundColor : activeItem === "sentText" ? "#EBB3A9" : "white"}}
          onPress={() => setActiveItem("sentText")}>
            <Text style={styles.tabText}>Sent Text</Text>
          </TouchableOpacity>
          <TouchableOpacity
          style={{...styles.tabItem,width : tabWidth,backgroundColor : activeItem === "receivedBox" ? "#EBB3A9" : "white"}}
          onPress={() => setActiveItem("receivedBox")}>
            <Text style={styles.tabText}>Received Box</Text>
          </TouchableOpacity>
          <TouchableOpacity
          style={{
            ...styles.tabItem,
            width : tabWidth,
            borderRightWidth : 0,
            backgroundColor : activeItem === "receivedText" ? "#EBB3A9" : "white"}}
          onPress={() => setActiveItem("receivedText")}>
            <Text style={styles.tabText}>Received Text</Text>
          </TouchableOpacity>

        </View>

        {activeItem === "sentBox" &&
        <ColorChoice
          title={"Sent Box Color"}
          defaultColor={toHsv(sentBoxColor)}
          setColor={setSentBoxColor}
        />}

        {activeItem === "sentText" &&
        <ColorChoice
          title={"Sent Text Color"}
          defaultColor={toHsv(sentTextColor)}
          setColor={setSentTextColor}
        />}

        {activeItem === "receivedBox" &&
        <ColorChoice
          title={"Received Box Color"}
          defaultColor={toHsv(receivedBoxColor)}
          setColor={setReceivedBoxColor}
        />}

        {activeItem === "receivedText" &&
        <ColorChoice
          title={"Received Text Color"}
          defaultColor={toHsv(receivedTextColor)}
          setColor={setReceivedTextColor}
        />}
      </View>

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
  },
  button : {
    backgroundColor : "#E86252",
    padding : 10,
    alignSelf : "center",
    marginTop : 10,
    borderRadius : 5
  },
  buttonText : {
    color : "white",
    fontWeight : "bold",
    textAlign : "center"
  },
  colorChoiceContainer : {
    backgroundColor : "white",
    marginHorizontal : 10,
    borderRadius : 5
  },
  tabRow : {
    flexDirection : "row",
    justifyContent : "space-around",
    borderBottomWidth : 1,
    borderBottomColor : "grey"
  },
  tabItem : {
    borderRightWidth : 1,
    borderRightColor : "grey",
    padding : 10,
    alignItems : "center",
    justifyContent : "center"
  },
  activeTabItem : {
    backgroundColor : "grey"
  },
  tabText : {
    color : "black",
    fontWeight : "bold"
  }
}
export default Customise;
