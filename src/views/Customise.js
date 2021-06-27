import React, { useState, useEffect, useRef } from 'react';
import { ScrollView, View, Text, Dimensions, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { ColorPicker, fromHsv, toHsv } from 'react-native-color-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ColorChoice from './ColorChoice';
import Header from './Header';
import SaveButton from './SaveButton'

const Customise = ({ navigation }) => {
  const [sentBoxColor, _setSentBoxColor] = useState("");
  const [sentTextColor, _setSentTextColor] = useState("");
  const [receivedBoxColor, _setReceivedBoxColor] = useState("");
  const [receivedTextColor, _setReceivedTextColor] = useState("");
  const [activeItem, setActiveItem] = useState("sentBox");
  const [tabWidth, setTabWidth] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saveButtonText, setSaveButtonText] = useState("Save");


  sentBoxColorRef = useRef();
  sentTextColorRef = useRef();
  receivedBoxColorRef = useRef();
  receivedTextColorRef = useRef();

  const setSentBoxColor = data => {
    sentBoxColorRef.current = data
    _setSentBoxColor(data)
  }
  const setSentTextColor = data => {
    sentTextColorRef.current = data
    _setSentTextColor(data)
  }
  const setReceivedBoxColor = data => {
    receivedBoxColorRef.current = data
    _setReceivedBoxColor(data)
  }
  const setReceivedTextColor = data => {
    receivedTextColorRef.current = data
    _setReceivedBoxColor(data)
  }

  useEffect(() => {
    loadStyles().then(() => setLoading(false));
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

    return await AsyncStorage.setItem("styles",JSON.stringify(style))
  }

  useEffect(() => {
    const beforeGoingBack = navigation.addListener('beforeRemove', async (e) => {
      e.preventDefault();
      const styles = JSON.parse(await AsyncStorage.getItem("styles"));

      const unsavedChanges = (
        sentBoxColorRef.current != styles.sentBoxColor ||
        sentTextColorRef.current != styles.sentTextColor ||
        receivedBoxColorRef.current != styles.receivedBoxColor ||
        receivedTextColorRef.current != styles.receivedTextColor
      )

      if(unsavedChanges) {
        Alert.alert(
          'Discard changes?',
          'You have unsaved changes. Are you sure to discard them and leave the screen?',
          [
            {
              text: 'Discard',
              style: 'destructive',
              // If the user confirmed, then we dispatch the action we blocked earlier
              // This will continue the action that had triggered the removal of the screen
              onPress: () => navigation.dispatch(e.data.action),
            },
            { text: "Stay", style: 'cancel', onPress: () => {} },
          ]
        );
      }
      else {
        navigation.dispatch(e.data.action);
      }
  })

    return beforeGoingBack;
  },[navigation])

  return (
    <ScrollView contentContainerStyle={{paddingBottom : 10}}>
      <Header title="Customise" allowGoBack/>

      {loading && <ActivityIndicator size="large" color="#e05e3f"/>}
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

      <SaveButton saveFunction={saveStyles}/>

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
