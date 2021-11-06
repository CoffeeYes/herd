import React, { useState, useEffect, useRef } from 'react';
import { ScrollView, View, Text, Dimensions, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { ColorPicker, fromHsv, toHsv } from 'react-native-color-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ColorChoice from './ColorChoice';
import Header from './Header';
import FlashTextButton from './FlashTextButton';
import CustomButton from './CustomButton';
import Slider from '@react-native-community/slider';

const Customise = ({ navigation }) => {
  const [sentBoxColor, _setSentBoxColor] = useState("");
  const [sentTextColor, _setSentTextColor] = useState("");
  const [receivedBoxColor, _setReceivedBoxColor] = useState("");
  const [receivedTextColor, _setReceivedTextColor] = useState("");
  const [activeItem, setActiveItem] = useState("sentBox");
  const [tabWidth, setTabWidth] = useState(0);
  const [loading, setLoading] = useState(true);
  const [originalStyles, setOriginalStyles] = useState({});
  const [fontSize, _setFontSize] = useState(14);


  const sentBoxColorRef = useRef();
  const sentTextColorRef = useRef();
  const receivedBoxColorRef = useRef();
  const receivedTextColorRef = useRef();
  const fontSizeRef = useRef();

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
    _setReceivedTextColor(data)
  }

  const setFontSize = data => {
    fontSizeRef.current = data;
    _setFontSize(data)
  }

  useEffect(() => {
    loadStyles().then(() => setLoading(false));
  },[])

  const loadStyles = async () => {
    const styles = JSON.parse(await AsyncStorage.getItem("styles"));

    if(styles) {
      setSentBoxColor(toHsv(styles.sentBoxColor));
      setSentTextColor(toHsv(styles.sentTextColor));
      setReceivedBoxColor(toHsv(styles.receivedBoxColor));
      setReceivedTextColor(toHsv(styles.receivedTextColor));
      setFontSize(styles.fontSize)
      setOriginalStyles(styles)
    }
  }

  const saveStyles = async () => {
    const style = {
      sentBoxColor : fromHsv(sentBoxColor),
      sentTextColor : fromHsv(sentTextColor),
      receivedBoxColor : fromHsv(receivedBoxColor),
      receivedTextColor : fromHsv(receivedTextColor),
      fontSize : fontSize
    }

    setOriginalStyles(style)
    return await AsyncStorage.setItem("styles",JSON.stringify(style))
  }

  useEffect(() => {
    const beforeGoingBack = navigation.addListener('beforeRemove', async (e) => {
      e.preventDefault();
      const styles = JSON.parse(await AsyncStorage.getItem("styles"));

      const unsavedChanges = (
        fromHsv(sentBoxColorRef.current) != styles.sentBoxColor ||
        fromHsv(sentTextColorRef.current) != styles.sentTextColor ||
        fromHsv(receivedBoxColorRef.current) != styles.receivedBoxColor ||
        fromHsv(receivedTextColorRef.current) != styles.receivedTextColor ||
        fontSizeRef.current != styles.fontSize
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

  const restoreDefault = async () => {
    //set default styling
    const style = {
      sentBoxColor : "#c6c6c6",
      sentTextColor : "#f5f5f5",
      receivedBoxColor : "#E86252",
      receivedTextColor : "#f5f5f5",
      fontSize : 14
    }

    Alert.alert(
      'Discard you sure you want to restore default styles?',
      '',
      [
        { text: "Go Back", style: 'cancel', onPress: () => {} },
        {
          text: 'Restore',
          style: 'destructive',
          // If the user confirmed, then we dispatch the action we blocked earlier
          // This will continue the action that had triggered the removal of the screen
          onPress: async () => {
            await AsyncStorage.setItem("styles",JSON.stringify(style));
            loadStyles();
          },
        },
      ]
    );
  }

  return (
    <>
    <Header title="Customise" allowGoBack/>
    <ScrollView contentContainerStyle={{paddingBottom : 10}}>

      {loading ?
      <ActivityIndicator size="large" color="#e05e3f"/>
      :
      <>
        <View style={styles.messagesContainer}>
          <View
          style={{...styles.message,...styles.messageFromYou, backgroundColor : fromHsv(sentBoxColor)}}>
            <Text style={{...styles.messageText, color : fromHsv(sentTextColor) || "black", fontSize : fontSize}}>Hello</Text>
            <Text style={{...styles.timestamp,color : fromHsv(sentTextColor) || "black", fontSize : fontSize}}>
            12:20
            </Text>
          </View>

          <View
          style={{...styles.message,...styles.messageFromOther, backgroundColor : fromHsv(receivedBoxColor)}}>
            <Text style={{...styles.messageText,color : fromHsv(receivedTextColor) || "black", fontSize : fontSize}}>Goodbye</Text>
            <Text style={{...styles.timestamp,color : fromHsv(receivedTextColor) || "black", fontSize : fontSize}}>
            12:21
            </Text>
          </View>
        </View>

        <View style={styles.sliderContainer}>
          <Slider
          style={{flex : 1}}
          onValueChange={val => setFontSize(Math.round(val))}
          value={originalStyles.fontSize}
          minimumValue={14}
          maximumValue={24}/>
          <View style={{alignItems : "center"}}>
            <Text style={{fontWeight : "bold"}}> Font Size </Text>
            <Text>{fontSize}</Text>
          </View>
        </View>

        <View style={styles.colorChoiceContainer}>
          <View style={styles.tabRow} onLayout={e => setTabWidth(e.nativeEvent.layout.width / 4)}>
            <TouchableOpacity
            style={{...styles.tabItem,width : tabWidth}}
            onPress={() => setActiveItem("sentBox")}>
              <Text style={{
                ...styles.tabText,
                color : activeItem === "sentBox" ? "#E86252" : "black"}}>
                  Sent Box
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
            style={{...styles.tabItem,width : tabWidth}}
            onPress={() => setActiveItem("sentText")}>
              <Text style={{
                ...styles.tabText,
                color : activeItem === "sentText" ? "#E86252" : "black"}}>
                  Sent Text
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
            style={{...styles.tabItem,width : tabWidth}}
            onPress={() => setActiveItem("receivedBox")}>
              <Text style={{
                ...styles.tabText,
                color : activeItem === "receivedBox" ? "#E86252" : "black"}}>
                  Received Box
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
            style={{
              ...styles.tabItem,
              width : tabWidth,
              borderRightWidth : 0}}
            onPress={() => setActiveItem("receivedText")}>
              <Text style={{
                ...styles.tabText,
                color : activeItem === "receivedText" ? "#E86252" : "black"}}>
                  Received Text
              </Text>
            </TouchableOpacity>

          </View>

          {activeItem === "sentBox" &&
          <ColorChoice
            title={"Sent Box Color"}
            color={toHsv(sentBoxColor)}
            setColor={setSentBoxColor}
            oldColor={originalStyles.sentBoxColor}
          />}

          {activeItem === "sentText" &&
          <ColorChoice
            title={"Sent Text Color"}
            color={toHsv(sentTextColor)}
            setColor={setSentTextColor}
            oldColor={originalStyles.sentTextColor}
          />}

          {activeItem === "receivedBox" &&
          <ColorChoice
            title={"Received Box Color"}
            color={toHsv(receivedBoxColor)}
            setColor={setReceivedBoxColor}
            oldColor={originalStyles.receivedBoxColor}
          />}

          {activeItem === "receivedText" &&
          <ColorChoice
            title={"Received Text Color"}
            color={toHsv(receivedTextColor)}
            setColor={setReceivedTextColor}
            oldColor={originalStyles.receivedTextColor}
          />}
        </View>

        <View style={styles.buttonRow}>
          <FlashTextButton
          normalText="Save"
          flashText="Saved!"
          onPress={saveStyles}
          timeout={500}
          buttonStyle={{...styles.buttonHeight,width : 100}}
          disabled={
            fromHsv(sentBoxColor) === originalStyles.sentBoxColor &&
            fromHsv(sentTextColor) === originalStyles.sentTextColor &&
            fromHsv(receivedBoxColor) === originalStyles.receivedBoxColor &&
            fromHsv(receivedTextColor) === originalStyles.receivedTextColor &&
            fontSize === originalStyles.fontSize
          }/>

          <CustomButton
          text={"Restore Default"}
          onPress={restoreDefault}
          disabled={
            sentBoxColor === "#c6c6c6" &&
            sentTextColor === "#f5f5f5" &&
            receivedBoxColor === "#E86252" &&
            receivedTextColor === "#f5f5f5" &&
            fontSize === 14
          }
          buttonStyle={{...styles.buttonHeight,marginLeft : 10}}/>

        </View>
      </>}
    </ScrollView>
    </>
  )
}

const styles = {
  messageFromOther : {
    backgroundColor : "#E86252",
  },
  messageFromYou : {
    backgroundColor : "#c6c6c6",
    alignSelf : "flex-end",
  },
  message : {
    padding : 20,
    width : "50%",
    marginVertical : 5,
    borderRadius : 10,
  },
  timestamp : {
    fontWeight : "bold",
    alignSelf : "flex-end"
  },
  messagesContainer : {
    flex : 1,
    margin : 10,
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
  },
  buttonRow : {
    flexDirection : "row",
    justifyContent : "center",
    alignItems : "center",
    marginTop : 10,
  },
  buttonHeight : {
    height : Dimensions.get("window").height * 0.075,
    justifyContent : "center"
  },
  sliderContainer : {
    alignItems : "center",
    flexDirection : "row",
    marginHorizontal : 10,
    backgroundColor : "white",
    marginBottom : 10,
    paddingVertical : 10,
    borderRadius : 5,
  },
}
export default Customise;
