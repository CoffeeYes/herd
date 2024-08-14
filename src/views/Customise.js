import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ScrollView, View, TouchableOpacity, Alert } from 'react-native';
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
import { useScreenAdjustedSize, useStateAndRef, clamp } from '../helper';

const titleFontMultiplier = 1.5;
const subtextFontMultiplier = 0.8;
const buttonIconSizeMultiplier = 0.2;

const clampHsv = (hsv, min = 0.01, max = 1) => {
  return ({
    ...hsv,
    s : clamp(hsv.s, min, max),
    v : clamp(hsv.v, min, max)
  })
}

const clampRgb = (rgb, min, max = 1) => {
  let hsv = toHsv(rgb);
  hsv = clampHsv(hsv,min,max);
  return fromHsv(hsv).toLowerCase();
}

const rgbToHsv = rgb => {
  return clampHsv(toHsv(rgb));
}

const hsvToRgb = hsv => {
  return fromHsv(clampHsv(hsv)).toLowerCase();
}

const Customise = () => {
  const dispatch = useDispatch();
  const [activeItem, setActiveItem] = useState(0);
  const [synchroniseFontChanges, setSynchroniseFontChanges] = useState(false);
  const [overrideFontSliderValues, setOverrideFontSliderValues] = useState(false);
  const [overrideColorChoiceSliderValue, setOverrideColorChoiceSliderValue] = useState(false);

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
    useValue : overrideFontSliderValues
  }

  const iconSize = useScreenAdjustedSize(0.1,0.065);
  const cardIconSize = useScreenAdjustedSize(0.075,0.05);
  const screenFontScaler = useScreenAdjustedSize(0.005,0.005);
  const headerIconSize = useScreenAdjustedSize(0.05,0.025,"width",0.7,1,1000,1000)
  const scaledHeaderIconSize = ((uiFontSize + 16) / defaultChatStyles.uiFontSize) * headerIconSize

  const [sentBoxColor, setSentBoxColor, sentBoxColorRef] = useStateAndRef(rgbToHsv(customStyle.sentBoxColor));
  const [sentTextColor, setSentTextColor, sentTextColorRef] = useStateAndRef(rgbToHsv(customStyle.sentTextColor));
  const [receivedBoxColor, setReceivedBoxColor, receivedBoxColorRef] = useStateAndRef(rgbToHsv(customStyle.receivedBoxColor));
  const [receivedTextColor, setReceivedTextColor, receivedTextColorRef] = useStateAndRef(rgbToHsv(customStyle.receivedTextColor));
  const [messageFontSize, setMessageFontSize, messageFontSizeRef] = useStateAndRef(customStyle.messageFontSize);
  const [uiFontSize, setUiFontSize, uiFontSizeRef] = useStateAndRef(customStyle.uiFontSize);
  const [scaledFontSize, setScaledFontSize] = useState(customStyle.uiFontSize);
  const [scaledSynchronisedFontSize, setScaledSynchronisedFontSize] = useState(customStyle.uiFontSize);
  const [synchronisedFontSize, setSynchronisedFontSize] = useState(customStyle.uiFontSize);

  useEffect(() => {
    setScaledFontSize(uiFontSize + screenFontScaler)
  },[uiFontSize, screenFontScaler])

  useEffect(() => {
    setScaledSynchronisedFontSize(synchronisedFontSize + screenFontScaler)
  },[synchronisedFontSize,screenFontScaler])

  //checks if fontsize states have been set to default values before turning overrideFontSliderValues off
  //to ensure sliders return to default positions
  useEffect(() => {
    if(
      uiFontSize === defaultChatStyles.uiFontSize && 
      messageFontSize === defaultChatStyles.messageFontSize && 
      synchronisedFontSize === defaultChatStyles.uiFontSize
    ) {
      setOverrideFontSliderValues(false);
    }
  },[uiFontSize, messageFontSize, synchronisedFontSize, activeItem])

  useEffect(() => {
    if(
      hsvToRgb(receivedTextColor) === clampRgb(defaultChatStyles.receivedTextColor) &&
      hsvToRgb(receivedBoxColor) === clampRgb(defaultChatStyles.receivedBoxColor) &&
      hsvToRgb(sentTextColor) === clampRgb(defaultChatStyles.sentTextColor) &&
      hsvToRgb(sentBoxColor) === clampRgb(defaultChatStyles.sentBoxColor)
    ) {
      setOverrideColorChoiceSliderValue(false);
    }
  },[receivedBoxColor,receivedTextColor,sentBoxColor,sentTextColor])

  const saveStyles = async () => {
    const style = {
      ...defaultChatStyles,
      sentBoxColor : fromHsv(sentBoxColor),
      sentTextColor : fromHsv(sentTextColor),
      receivedBoxColor : fromHsv(receivedBoxColor),
      receivedTextColor : fromHsv(receivedTextColor),
      messageFontSize : messageFontSize,
      uiFontSize : uiFontSize,
      titleSize : uiFontSize * titleFontMultiplier,
      subTextSize : uiFontSize * subtextFontMultiplier,
    }

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
            setOverrideFontSliderValues(true);
            setOverrideColorChoiceSliderValue(true);
            await AsyncStorage.setItem("styles",JSON.stringify(defaultChatStyles));
            dispatch(setStyles(defaultChatStyles));
            setSentBoxColor(rgbToHsv(defaultChatStyles.sentBoxColor));
            setSentTextColor(rgbToHsv(defaultChatStyles.sentTextColor));
            setReceivedBoxColor(rgbToHsv(defaultChatStyles.receivedBoxColor));
            setReceivedTextColor(rgbToHsv(defaultChatStyles.receivedTextColor));
            setUiFontSize(defaultChatStyles.uiFontSize);
            setMessageFontSize(defaultChatStyles.messageFontSize);
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
      const clampedOriginal = original[key]?.v ? fromHsv(clampHsv(original[key]),0.01,1) : clampRgb(original[key], 0.01, 1);
      const clampedUpdated = updated[key]?.v ? fromHsv(clampHsv(updated[key]),0.01,1) : clampRgb(updated[key],0.01,1);
      if(clampedOriginal !== clampedUpdated) {
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
    return !checkStylesAreEqual(styles,{
      sentBoxColor : sentBoxColorRef.current,
      sentTextColor : sentTextColorRef.current,
      receivedBoxColor : receivedBoxColorRef.current,
      receivedTextColor : receivedTextColorRef.current,
      messageFontSize : messageFontSizeRef.current,
      uiFontSize : uiFontSizeRef.current,
    });
  }

  return (
    <NavigationWarningWrapper
    checkForChanges={haveUnsavedChanges}>
      <Header title="Customise" allowGoBack/>
      <ScrollView contentContainerStyle={{paddingBottom : 10}}>
         <Header
          title="Preview"
          allowGoBack
          disableBackButton
          rightButtonIcon="delete"
          rightButtonOnClick={() => {}}
          disableRightButton
          backArrowSize={scaledHeaderIconSize}
          rightIconSize={scaledHeaderIconSize}
          textStyle={{fontSize : (synchroniseFontChanges ? scaledSynchronisedFontSize : scaledFontSize) * titleFontMultiplier}}
          containerStyle={styles.topSpacer}/>

          <CardButton
          containerStyle={{alignSelf : "center"}}
          iconSize={cardIconSize + (scaledFontSize * buttonIconSizeMultiplier)}
          disableTouch
          text="Preview"
          textStyle={{fontSize : (synchroniseFontChanges ? scaledSynchronisedFontSize : scaledFontSize)}}
          rightIcon="preview"/>

          <ListItem
          name="Preview"
          rightText="Preview"
          subText="Preview"
          rightTextStyle={{fontSize : ((synchroniseFontChanges ? scaledSynchronisedFontSize : scaledFontSize) * subtextFontMultiplier) + screenFontScaler}}
          subTextStyle={{fontSize : ((synchroniseFontChanges ? scaledSynchronisedFontSize : scaledFontSize) * subtextFontMultiplier) + screenFontScaler}}
          textStyle={{fontSize : (synchroniseFontChanges ? scaledSynchronisedFontSize : scaledFontSize)}}
          disableTouch
          />

          <CustomButton
          text="Preview"
          disabled 
          useDisabledStyle={false}
          buttonStyle={styles.topSpacer}
          textStyle={{fontSize : (synchroniseFontChanges ? scaledSynchronisedFontSize : scaledFontSize)}}
          />

          <View style={styles.fontSlidersContainer}>
            <TouchableOpacity
            style={{...styles.topSpacer, marginLeft : 20, alignSelf : "flex-start"}}
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
            textFontSize={(synchroniseFontChanges ? scaledSynchronisedFontSize : messageFontSize + screenFontScaler)}
            timestamp="12 : 20"
            customStyle={getChatBubbleColor()}
            messageFrom={true}/>

            <ChatBubble
            disableTouch
            text="This is a sample response message"
            textFontSize={(synchroniseFontChanges ? scaledSynchronisedFontSize : messageFontSize + screenFontScaler)}
            timestamp="12 : 21"
            customStyle={getChatBubbleColor()}
            messageFrom={false}/>
          </View>

          <View style={styles.colorChoiceContainer}>
            <Dropdown
            onChangeOption={index => {
              setOverrideColorChoiceSliderValue(true);
              setActiveItem(index);
            }}
            choices={tabItems}
            textStyle={{fontSize : customStyle.scaledUIFontSize}}
            chosenStyle={{color : palette.primary}}
            dropDownBoxStyle={{borderRadius : 5}}
            />
            <ColorChoice
            overrideSliderValues={overrideColorChoiceSliderValue}
            color={toHsv(tabItems[activeItem].color)}
            setColor={tabItems[activeItem].setColor}
            oldColor={customStyle[tabItems[activeItem].originalColor]}
            sliderTextSize={customStyle.scaledUIFontSize}
            />
          </View>

          <View style={styles.buttonRow}>
            <FlashTextButton
            normalText="Save"
            flashText="Saved!"
            onPress={saveStyles}
            timeout={500}
            buttonStyle={{...styles.button, flexDirection : "row", width : "45%"}}
            disabled={checkStylesAreEqual(customStyle,{
              sentBoxColor,sentTextColor,receivedBoxColor,
              receivedTextColor,messageFontSize,uiFontSize
            })}/>

            <CustomButton
            text={"Restore Default"}
            onPress={restoreDefault}
            disabled={checkStylesAreEqual(customStyle,defaultChatStyles)}
            buttonStyle={{ ...styles.button, marginLeft : 10, width : "45%"}}/>

          </View>
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
  },
  topSpacer : {
    marginTop : 10
  }
}
export default Customise;
