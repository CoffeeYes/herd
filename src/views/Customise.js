import React, { useState, useEffect, useRef, Fragment } from 'react';
import { useDispatch } from 'react-redux';
import { ScrollView, View, Text, Dimensions, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { ColorPicker, fromHsv, toHsv } from 'react-native-color-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ColorChoice from './ColorChoice';
import Header from './Header';
import FlashTextButton from './FlashTextButton';
import CustomButton from './CustomButton';
import CardButton from './CardButton';
import TabItem from './TabItem';
import ListItem from './ListItem';
import ChatBubble from './ChatBubble';
import Icon from 'react-native-vector-icons/MaterialIcons';

import Slider from './Slider';

import { setStyles } from '../redux/actions/chatActions';

import { defaultChatStyles } from '../assets/styles';
import { palette } from '../assets/palette';

const Customise = ({ navigation }) => {
  const dispatch = useDispatch();
  const [sentBoxColor, _setSentBoxColor] = useState("");
  const [sentTextColor, _setSentTextColor] = useState("");
  const [receivedBoxColor, _setReceivedBoxColor] = useState("");
  const [receivedTextColor, _setReceivedTextColor] = useState("");
  const [activeItem, setActiveItem] = useState(0);
  const [tabWidth, setTabWidth] = useState(0);
  const [loading, setLoading] = useState(true);
  const [originalStyles, setOriginalStyles] = useState({});
  const [messageFontSize, _setMessageFontSize] = useState(defaultChatStyles.messageFontSize);
  const [uiFontSize, _setUiFontSize] = useState(defaultChatStyles.uiFontSize);
  const [synchroniseFontChanges, setSynchroniseFontChanges] = useState(true);


  const sentBoxColorRef = useRef();
  const sentTextColorRef = useRef();
  const receivedBoxColorRef = useRef();
  const receivedTextColorRef = useRef();
  const messageFontSizeRef = useRef();
  const uiFontSizeRef = useRef();

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

  const setMessageFontSize = data => {
    messageFontSizeRef.current = data;
    _setMessageFontSize(data)
  }
  const setUiFontSize = data => {
    uiFontSizeRef.current = data;
    _setUiFontSize(data)
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
      setMessageFontSize(styles.messageFontSize);
      setUiFontSize(styles.uiFontSize);
      setOriginalStyles(styles);
    }
  }

  const saveStyles = async () => {
    const style = {
      ...defaultChatStyles,
      sentBoxColor : fromHsv(sentBoxColor),
      sentTextColor : fromHsv(sentTextColor),
      receivedBoxColor : fromHsv(receivedBoxColor),
      receivedTextColor : fromHsv(receivedTextColor),
      messageFontSize : messageFontSize,
      uiFontSize : uiFontSize,
      titleSize : uiFontSize * 1.5,
      subTextSize : uiFontSize * 0.8,
    }

    setOriginalStyles(style);
    await AsyncStorage.setItem("styles",JSON.stringify(style));
    dispatch(setStyles(style));
    return true;
  }

  useEffect(() => {
    const beforeGoingBack = navigation.addListener('beforeRemove', async (e) => {
      e.preventDefault();
      const styles = JSON.parse(await AsyncStorage.getItem("styles"));

      const unsavedChanges = (
        fromHsv(sentBoxColorRef.current).toLowerCase() != styles.sentBoxColor.toLowerCase() ||
        fromHsv(sentTextColorRef.current).toLowerCase() != styles.sentTextColor.toLowerCase() ||
        fromHsv(receivedBoxColorRef.current).toLowerCase() != styles.receivedBoxColor.toLowerCase() ||
        fromHsv(receivedTextColorRef.current).toLowerCase() != styles.receivedTextColor.toLowerCase() ||
        messageFontSizeRef.current != styles.messageFontSize ||
        uiFontSizeRef.current != styles.uiFontSize
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
            await AsyncStorage.setItem("styles",JSON.stringify(defaultChatStyles));
            dispatch(setStyles(defaultChatStyles));
            loadStyles();
          },
        },
      ]
    );
  }
  const tabItems = [
    {
    	name : "sentBox",
    	text : "Sent Box",
      title : "Sent Box Color",
      color : sentBoxColor,
      originalColor : "sentBoxColor",
      setColor : setSentBoxColor
    },
    {
    	name : "sentText",
    	text : "Sent Text",
      title : "Sent Text Color",
      color : sentTextColor,
      originalColor : "sentTextColor",
      setColor : setSentTextColor
    },
    {
    	name : "receivedBox",
    	text : "Received Box",
      title : "Received Box Color",
      color : receivedBoxColor,
      originalColor : "receivedBoxColor",
      setColor : setReceivedBoxColor
    },
    {
    	name : "receivedText",
    	text : "Received Text",
      title : "Received Text Color",
      color : receivedTextColor,
      originalColor : "receivedTextColor",
      setColor : setReceivedTextColor
    }
  ];

  const fontSizes = [
    {
      tag : "message_size",
      value : messageFontSize,
      setValue : setMessageFontSize,
      title : "Messages",
      rightTitle : "font size",
      rightText : messageFontSize?.toString()
    },
    {
      tag : "ui_size",
      value : uiFontSize,
      setValue : setUiFontSize,
      title : "User Interface",
      rightTitle : "font size",
      rightText : uiFontSize?.toString()
    }
  ]

  const changeFonts = (val,index) => {
    if(synchroniseFontChanges) {
      fontSizes.map(item => item.setValue(val))
    }
    else {
      fontSizes[index].setValue(val);
    }
  }

  return (
    <>
    <Header title="Customise" allowGoBack/>
    <ScrollView contentContainerStyle={{paddingBottom : 10}}>

      {loading ?
      <ActivityIndicator size="large" color={palette.primary}/>
      :
      <>
        <View style={styles.messagesContainer}>
          <ChatBubble
          touchable={false}
          text="This is a sample sent message"
          timestamp="12 : 20"
          customStyle={{
            sentBoxColor : fromHsv(sentBoxColor),
            receivedBoxColor : fromHsv(receivedBoxColor),
            sentTextColor : fromHsv(sentTextColor),
            receivedTextColor : fromHsv(receivedTextColor),
            messageFontSize : messageFontSize}
          }
          messageFrom={true}/>

          <ChatBubble
          touchable={false}
          text="This is a sample response message"
          timestamp="12 : 21"
          customStyle={{
            sentBoxColor : fromHsv(sentBoxColor),
            receivedBoxColor : fromHsv(receivedBoxColor),
            sentTextColor : fromHsv(sentTextColor),
            receivedTextColor : fromHsv(receivedTextColor),
            messageFontSize : messageFontSize}
          }
          messageFrom={false}/>

        </View>

        <Header title="Preview" textStyle={{fontSize : uiFontSize * 1.5}}/>

        <View style={{alignItems : "center"}}>
          <CardButton
          disableTouch
          text="Preview"
          textStyle={{fontSize : uiFontSize}}
          rightIcon="preview" iconSize={uiFontSize + 16}/>
        </View>

        <ListItem
        name="Preview"
        rightText="Preview"
        subText="Preview"
        rightTextStyle={{fontSize : uiFontSize * 0.8}}
        subTextStyle={{fontSize : uiFontSize * 0.8}}
        textStyle={{fontSize : uiFontSize}}
        disableTouch
        />

        <View style={styles.fontSlidersContainer}>
          <TouchableOpacity
          style={{marginLeft : 20, marginTop : 10, alignSelf : "flex-start"}}
          onPress={() => setSynchroniseFontChanges(!synchroniseFontChanges)}>
            <Icon
            size={32}
            color={synchroniseFontChanges ? palette.primary : palette.black}
            name={synchroniseFontChanges ? "lock" : "lock-open"}/>
          </TouchableOpacity>

          {fontSizes.map(item=> {
            return (
              <Fragment key={item.tag}>
                <Text style={{alignSelf : "center", fontWeight : "bold"}}>{item.title}</Text>
                <Slider
                containerStyle={styles.sliderContainer}
                sliderStyle={{flex : 1}}
                tapToSeek
                onSlidingComplete={val => changeFonts(Math.round(val),index)}
                onValueChange={val => changeFonts(Math.round(val),index)}
                value={item.value}
                min={defaultChatStyles.messageFontSize}
                max={24}
                rightTitle={item.rightTitle}
                rightText={item.rightText}
                rightTextContainerStyle={{alignItems : "center", padding : 5, justifyContent : "center"}}
                rightTitleStyle={{fontWeight : "bold"}}
                />
              </Fragment>
            )
          })}
        </View>

        <View style={styles.colorChoiceContainer}>
          <View style={styles.tabRow} onLayout={e => setTabWidth(e.nativeEvent.layout.width / 4)}>
            {tabItems.map((item,index) => {
              return (
                <TabItem
                key={index}
                text={item.text}
                containerStyle={{width : tabWidth,borderBottomWidth : 1, borderBottomColor : "rgba(255,255,255,0)"}}
                active={activeItem === index}
                onPress={() => setActiveItem(index)}/>
              )})
            }
          </View>


          <ColorChoice
            title={tabItems[activeItem].name}
            color={toHsv(tabItems[activeItem].color)}
            setColor={tabItems[activeItem].setColor}
            oldColor={originalStyles[tabItems[activeItem].originalColor]}
          />
        </View>

        <View style={styles.buttonRow}>
          <FlashTextButton
          normalText="Save"
          flashText="Saved!"
          onPress={saveStyles}
          timeout={500}
          buttonStyle={{...styles.button, flexDirection : "row"}}
          disabled={
            fromHsv(sentBoxColor).toLowerCase() == originalStyles.sentBoxColor.toLowerCase() &&
            fromHsv(sentTextColor).toLowerCase() == originalStyles.sentTextColor.toLowerCase() &&
            fromHsv(receivedBoxColor).toLowerCase() == originalStyles.receivedBoxColor.toLowerCase() &&
            fromHsv(receivedTextColor).toLowerCase() == originalStyles.receivedTextColor.toLowerCase() &&
            messageFontSize === originalStyles.messageFontSize &&
            uiFontSize === originalStyles.uiFontSize
          }/>

          <CustomButton
          text={"Restore Default"}
          onPress={restoreDefault}
          disabled={
            fromHsv(originalStyles.sentBoxColor).toLowerCase() == defaultChatStyles.sentBoxColor.toLowerCase() &&
            fromHsv(originalStyles.sentTextColor).toLowerCase() == defaultChatStyles.sentTextColor.toLowerCase() &&
            fromHsv(originalStyles.receivedBoxColor).toLowerCase() == defaultChatStyles.receivedBoxColor.toLowerCase() &&
            fromHsv(originalStyles.receivedTextColor).toLowerCase() == defaultChatStyles.receivedTextColor.toLowerCase() &&
            originalStyles.messageFontSize == defaultChatStyles.messageFontSize &&
            originalStyles.uiFontSize == defaultChatStyles.uiFontSize
          }
          buttonStyle={{ ...styles.button, marginLeft : 10}}/>

        </View>
      </>}
    </ScrollView>
    </>
  )
}

const styles = {
  messagesContainer : {
    flex : 1,
    margin : 10,
  },
  colorChoiceContainer : {
    backgroundColor : palette.white,
    marginHorizontal : 10,
    borderRadius : 5,
    elevation : 2
  },
  tabRow : {
    flexDirection : "row",
    justifyContent : "space-around",
    borderBottomWidth : 1,
    borderBottomColor : palette.offgrey
  },
  tabItem : {
    borderBottomWidth : 1,
    borderbottomColor : "rgba(255,255,255,0)"
  },
  buttonRow : {
    flexDirection : "row",
    justifyContent : "center",
    alignItems : "center",
    marginTop : 10,
  },
  sliderContainer : {
    alignItems : "center",
    flexDirection : "row",
    marginHorizontal : 10,
    backgroundColor : palette.white,
    marginBottom : 10,
    paddingVertical : 10,
    borderRadius : 5,
  },
  button : {
    height : "100%",
    justifyContent : "center",
    alignItems : "center"
  },
  fontSlidersContainer : {
    backgroundColor : palette.white,
    elevation : 2,
    marginHorizontal : 10,
    marginVertical : 10,
    borderRadius : 5,
    paddingVertical : 10,
  }
}
export default Customise;
