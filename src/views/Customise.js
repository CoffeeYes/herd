import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ScrollView, View, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { fromHsv, toHsv } from 'react-native-color-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ColorChoice from './ColorChoice';
import Header from './Header';
import FlashTextButton from './FlashTextButton';
import CustomButton from './CustomButton';
import CardButton from './CardButton';
import ListItem from './ListItem';
import ChatBubble from './ChatBubble';
import Dropdown from './Dropdown';
import Icon from 'react-native-vector-icons/MaterialIcons';
import NavigationWarningWrapper from './NavigationWarningWrapper';

import ValueSlider from './ValueSlider';

import { setStyles } from '../redux/actions/chatActions';

import { defaultChatStyles, boundaryValues } from '../assets/styles';
import { palette } from '../assets/palette';
import { useScreenAdjustedSize, useStateAndRef } from '../helper';

const Customise = ({ navigation }) => {
  const dispatch = useDispatch();
  const [activeItem, setActiveItem] = useState(0);
  const [loading, setLoading] = useState(true);
  const [originalStyles, setOriginalStyles] = useState({});
  const [scaledFontSize, setScaledFontSize] = useState(defaultChatStyles.uiFontSize);
  const [synchroniseFontChanges, setSynchroniseFontChanges] = useState(false);
  const [synchronisedFontSize, setSynchronisedFontSize] = useState(defaultChatStyles.uiFontSize);
  const [overrideSliderValue, setOverrideSliderValue] = useState(false);
  const [renderColorChoice, setRenderColorChoice] = useState(true);

  const customStyle = useSelector(state => state.chatReducer.styles);

  const fontSliderProps = {
    min : boundaryValues.minFontSize,
    max : boundaryValues.maxFontSize,
    step : 1,
    tapToSeek : true,
    titleStyle : { fontSize : customStyle.scaledUIFontSize },
    rightTextContainerStyle : {alignItems : "center", padding : 5, justifyContent : "center"},
    rightTitleStyle : {fontWeight : "bold", fontSize : customStyle.scaledUIFontSize},
    rightTextStyle : {fontSize : customStyle.scaledUIFontSize},
    useValue : overrideSliderValue
  }

  const iconSize = useScreenAdjustedSize(0.1,0.065);
  const cardIconSize = useScreenAdjustedSize(0.075,0.05);
  const screenFontScaler = useScreenAdjustedSize(0.005,0.005);
  const headerIconSize = useScreenAdjustedSize(0.05,0.025,"width",0.7,1,1000,1000)
  const scaledHeaderIconSize = ((uiFontSize + 16) / defaultChatStyles.uiFontSize) * headerIconSize

  const [sentBoxColor, setSentBoxColor, sentBoxColorRef] = useStateAndRef("");
  const [sentTextColor, setSentTextColor, sentTextColorRef] = useStateAndRef("");
  const [receivedBoxColor, setReceivedBoxColor, receivedBoxColorRef] = useStateAndRef("");
  const [receivedTextColor, setReceivedTextColor, receivedTextColorRef] = useStateAndRef("");
  const [messageFontSize, setMessageFontSize, messageFontSizeRef] = useStateAndRef(defaultChatStyles.messageFontSize);
  const [uiFontSize, setUiFontSize, uiFontSizeRef] = useStateAndRef(defaultChatStyles.uiFontSize);

  useEffect(() => {
    loadStyles().then(() => setLoading(false));
  },[])

  useEffect(() => {
    setScaledFontSize(uiFontSize + screenFontScaler)
  },[uiFontSize, screenFontScaler])

  //checks if fontsize states have been set to default values before turning overrideSliderValue off
  //to ensure sliders return to default positions
  useEffect(() => {
    if(
      uiFontSize === defaultChatStyles.uiFontSize && 
      messageFontSize === defaultChatStyles.messageFontSize && 
      synchronisedFontSize === defaultChatStyles.uiFontSize && 
      overrideSliderValue &&
      tabItems[activeItem].color === defaultChatStyles[tabItems[activeItem].originalColor]
    ) {
      setOverrideSliderValue(false);
    }
  },[uiFontSize, messageFontSize])

  useEffect(() => {
    setOverrideSliderValue(false);
  },[activeItem])

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
      if(styles.uiFontSize == styles.messageFontSize) {
        setSynchronisedFontSize(styles.uiFontSize);
      }
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
            setOverrideSliderValue(true);
            await AsyncStorage.setItem("styles",JSON.stringify(defaultChatStyles));
            dispatch(setStyles(defaultChatStyles));
            loadStyles();
            setSynchronisedFontSize(defaultChatStyles.uiFontSize);
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
      rightText : messageFontSize
    },
    {
      tag : "ui_size",
      value : uiFontSize,
      setValue : setUiFontSize,
      title : "User Interface",
      rightTitle : "font size",
      rightText : uiFontSize
    }
  ]

  const setAllFontSizes = value => {
    const roundedValue = Math.round(value)
    fontSizes.forEach(item => item.setValue(roundedValue));
    setSynchronisedFontSize(roundedValue)
  }

  const getChatBubbleColor = () => {
    return ({
      sentBoxColor : fromHsv(sentBoxColor),
      receivedBoxColor : fromHsv(receivedBoxColor),
      sentTextColor : fromHsv(sentTextColor),
      receivedTextColor : fromHsv(receivedTextColor),
      messageFontSize : messageFontSize
    })
  }

  const checkStylesAreEqual = (original, updated) => {
    const colorKeys = ["sentBoxColor","sentTextColor","receivedBoxColor","receivedTextColor"];
    const fontKeys = ["uiFontSize","messageFontSize"];
    for(const key of colorKeys) {
      if(fromHsv(original[key]).toLowerCase() !== updated[key].toLowerCase()) {
        return false;
      }
    }
    for(const key of fontKeys) {
      if(original[key] !== updated[key]) {
        return false;
      }
    }
    return true;
  }

  const haveUnsavedChanges = async () => {
    const styles = JSON.parse(await AsyncStorage.getItem("styles"));
    return !checkStylesAreEqual({
      sentBoxColor : sentBoxColorRef.current,
      sentTextColor : sentTextColorRef.current,
      receivedBoxColor : receivedBoxColorRef.current,
      receivedTextColor : receivedTextColorRef.current,
      messageFontSize : messageFontSizeRef.current,
      uiFontSize : uiFontSizeRef.current,
    },styles);
  }

  return (
    <NavigationWarningWrapper
    navigation={navigation}
    checkForChanges={haveUnsavedChanges}>
      <Header title="Customise" allowGoBack/>
      <ScrollView contentContainerStyle={{paddingBottom : 10}}>

        {loading ?
        <ActivityIndicator size="large" color={palette.primary}/>
        :
        <>
         <Header
          title="Preview"
          allowGoBack
          disableBackButton
          rightButtonIcon="delete"
          disableRightButton
          backArrowSize={scaledHeaderIconSize}
          rightIconSize={scaledHeaderIconSize}
          textStyle={{fontSize : scaledFontSize * 1.5}}
          containerStyle={{marginTop : 10}}/>

          <CardButton
          containerStyle={{alignSelf : "center"}}
          iconSize={cardIconSize + (scaledFontSize*0.2)}
          disableTouch
          text="Preview"
          textStyle={{fontSize : scaledFontSize}}
          rightIcon="preview"/>

          <ListItem
          name="Preview"
          rightText="Preview"
          subText="Preview"
          rightTextStyle={{fontSize : (scaledFontSize * 0.8) + screenFontScaler}}
          subTextStyle={{fontSize : (scaledFontSize * 0.8) + screenFontScaler}}
          textStyle={{fontSize : scaledFontSize}}
          disableTouch
          />

          <CustomButton
          text="Preview"
          disabled 
          useDisabledStyle={false}
          buttonStyle={{marginTop : 10}}
          textStyle={{fontSize : scaledFontSize}}
          />

          <View style={styles.fontSlidersContainer}>
            <TouchableOpacity
            style={{marginLeft : 20, marginTop : 10, alignSelf : "flex-start"}}
            onPress={() => setSynchroniseFontChanges(!synchroniseFontChanges)}>
              <Icon
              size={iconSize}
              color={synchroniseFontChanges ? palette.primary : palette.black}
              name={synchroniseFontChanges ? "lock" : "lock-open"}/>
            </TouchableOpacity>

            {synchroniseFontChanges ? 
            <ValueSlider
            {...fontSliderProps}
            value={synchronisedFontSize}
            title={fontSizes.map(item => item.title).join(" + ")}
            onSlidingComplete={value => setAllFontSizes(value)}
            onValueChange={value => setAllFontSizes(value)}
            rightTitle="font size"
            rightText={synchronisedFontSize}
            />
            :
            fontSizes.map((item)=> {
              return (
                <ValueSlider
                {...fontSliderProps}
                title={item.title}
                key={item.title}
                onSlidingComplete={value => item.setValue(Math.round(value))}
                onValueChange={value => item.setValue(Math.round(value))}
                value={item.value}
                rightTitle={item.rightTitle}
                rightText={item.rightText}
                />
              )
            })}
          </View>

          <View style={styles.messagesContainer}>
            <ChatBubble
            disableTouch
            text="This is a sample sent message"
            textFontSize={messageFontSize + screenFontScaler}
            timestamp="12 : 20"
            customStyle={getChatBubbleColor()}
            messageFrom={true}/>

            <ChatBubble
            disableTouch
            text="This is a sample response message"
            textFontSize={messageFontSize + screenFontScaler}
            timestamp="12 : 21"
            customStyle={getChatBubbleColor()}
            messageFrom={false}/>
          </View>

          <View style={styles.colorChoiceContainer}>
            <Dropdown
            onChangeOption={index => {
              setOverrideSliderValue(true);
              setActiveItem(index);
            }}
            choices={tabItems}
            textStyle={{fontSize : customStyle.scaledUIFontSize}}
            chosenStyle={{color : palette.primary}}
            dropDownBoxStyle={{borderRadius : 5}}
            />
            {renderColorChoice &&
            <ColorChoice
            overrideSliderValues={overrideSliderValue}
            color={toHsv(tabItems[activeItem].color)}
            setColor={tabItems[activeItem].setColor}
            oldColor={originalStyles[tabItems[activeItem].originalColor]}
            sliderTextSize={customStyle.scaledUIFontSize}
            />}
          </View>

          <View style={styles.buttonRow}>
            <FlashTextButton
            normalText="Save"
            flashText="Saved!"
            onPress={saveStyles}
            timeout={500}
            buttonStyle={{...styles.button, flexDirection : "row", width : "45%"}}
            disabled={checkStylesAreEqual({
              sentBoxColor,sentTextColor,receivedBoxColor,
              receivedTextColor,messageFontSize,uiFontSize
            },originalStyles)}/>

            <CustomButton
            text={"Restore Default"}
            onPress={restoreDefault}
            disabled={checkStylesAreEqual(originalStyles,defaultChatStyles)}
            buttonStyle={{ ...styles.button, marginLeft : 10, width : "45%"}}/>

          </View>
        </>}
      </ScrollView>
    </NavigationWarningWrapper>
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
    elevation : 2,
    zIndex : 10
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
