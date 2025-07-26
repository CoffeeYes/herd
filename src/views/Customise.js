import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ScrollView, View, TouchableOpacity } from 'react-native';
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
import ConfirmationModal from './ConfirmationModal';

import ValueSlider from './ValueSlider';

import { setStyles } from '../redux/actions/appStateActions';

import { defaultChatStyles, boundaryValues } from '../assets/styles';
import { palette } from '../assets/palette';
import { useScreenAdjustedSize, fromHsv, clampRgb, rgbToHsv, hsvToRgb } from '../helper';
import { STORAGE_STRINGS } from '../common';

const titleFontMultiplier = 1.5;
const subtextFontMultiplier = 0.8;
const buttonIconSizeMultiplier = 0.2;

const Customise = () => {
  const dispatch = useDispatch();
  const [activeItem, setActiveItem] = useState(0);
  const [synchroniseFontChanges, setSynchroniseFontChanges] = useState(false);
  const [overrideFontSliderValues, setOverrideFontSliderValues] = useState(false);
  const [overrideColorChoiceSliderValue, setOverrideColorChoiceSliderValue] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [restoringDefault, setRestoringDefault] = useState(false);

  const customStyle = useSelector(state => state.appStateReducer.styles);

  const fontSliderProps = {
    minimumValue : boundaryValues.minFontSize,
    maximumValue : boundaryValues.maxFontSize,
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

  const [sentBoxColor, setSentBoxColor] = useState(rgbToHsv(customStyle.sentBoxColor));
  const [sentTextColor, setSentTextColor] = useState(rgbToHsv(customStyle.sentTextColor));
  const [receivedBoxColor, setReceivedBoxColor] = useState(rgbToHsv(customStyle.receivedBoxColor));
  const [receivedTextColor, setReceivedTextColor] = useState(rgbToHsv(customStyle.receivedTextColor));
  const [messageFontSize, setMessageFontSize] = useState(customStyle.messageFontSize);
  const [uiFontSize, setUiFontSize] = useState(customStyle.uiFontSize);
  const [scaledFontSize, setScaledFontSize] = useState(customStyle.uiFontSize);
  const [scaledSynchronisedFontSize, setScaledSynchronisedFontSize] = useState(customStyle.uiFontSize);
  const [synchronisedFontSize, setSynchronisedFontSize] = useState(customStyle.uiFontSize);

  const activeScaledFontSize = synchroniseFontChanges ? scaledSynchronisedFontSize : scaledFontSize;
  const activeMessageFontSize = synchroniseFontChanges ? synchronisedFontSize : messageFontSize + screenFontScaler;

  const unsavedChangesRef = useRef(false);

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
      synchronisedFontSize === defaultChatStyles.uiFontSize &&
      overrideFontSliderValues
    ) {
      setOverrideFontSliderValues(false);
    }
  },[uiFontSize, messageFontSize, synchronisedFontSize, overrideFontSliderValues])

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

  useEffect(() => {
    setOverrideColorChoiceSliderValue(false);
  },[activeItem])

  useEffect(() => {
    unsavedChangesRef.current = !checkStylesAreEqual(customStyle,{
      sentTextColor,
      sentBoxColor,
      receivedBoxColor,
      receivedTextColor,
      messageFontSize,
      uiFontSize
    })
  },[receivedBoxColor,receivedTextColor,sentBoxColor,sentTextColor,messageFontSize,uiFontSize, customStyle])

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

    await AsyncStorage.setItem(STORAGE_STRINGS.STYLES,JSON.stringify(style));
    dispatch(setStyles(style));
    return true;
  }

  const restoreDefaultStyles = async () => {
    setRestoringDefault(true);
    setOverrideFontSliderValues(true);
    setOverrideColorChoiceSliderValue(true);
    await AsyncStorage.setItem(STORAGE_STRINGS.STYLES,JSON.stringify(defaultChatStyles));
    dispatch(setStyles(defaultChatStyles));
    setSentBoxColor(rgbToHsv(defaultChatStyles.sentBoxColor));
    setSentTextColor(rgbToHsv(defaultChatStyles.sentTextColor));
    setReceivedBoxColor(rgbToHsv(defaultChatStyles.receivedBoxColor));
    setReceivedTextColor(rgbToHsv(defaultChatStyles.receivedTextColor));
    setUiFontSize(defaultChatStyles.uiFontSize);
    setMessageFontSize(defaultChatStyles.messageFontSize);
    setSynchronisedFontSize(defaultChatStyles.uiFontSize);
    setRestoringDefault(false);
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
    fontSizes.forEach(item => item.setValue(value));
    setSynchronisedFontSize(value)
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
      const clampedOriginal = original[key]?.v ? hsvToRgb(original[key]) : clampRgb(original[key]);
      const clampedUpdated = updated[key]?.v ? hsvToRgb(updated[key]) : clampRgb(updated[key]);
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

  return (
    <NavigationWarningWrapper
    checkForChanges={() => unsavedChangesRef.current}>
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
          textStyle={{fontSize : (activeScaledFontSize) * titleFontMultiplier}}
          containerStyle={styles.topSpacer}/>

          <CardButton
          containerStyle={{alignSelf : "center"}}
          iconSize={cardIconSize + (scaledFontSize * buttonIconSizeMultiplier)}
          disableTouch
          text="Preview"
          textStyle={{fontSize : (activeScaledFontSize)}}
          rightIcon="preview"/>

          <ListItem
          name="Preview"
          rightText="Preview"
          subText="Preview"
          rightTextStyle={{fontSize : ((activeScaledFontSize) * subtextFontMultiplier) + screenFontScaler}}
          subTextStyle={{fontSize : ((activeScaledFontSize) * subtextFontMultiplier) + screenFontScaler}}
          textStyle={{fontSize : (activeScaledFontSize)}}
          disableTouch
          />

          <CustomButton
          text="Preview"
          disabled 
          useDisabledStyle={false}
          buttonStyle={styles.topSpacer}
          textStyle={{fontSize : (activeScaledFontSize)}}
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
            value={Math.round(synchronisedFontSize)}
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
                onSlidingComplete={value => item.setValue(value)}
                onValueChange={value => item.setValue(value)}
                value={Math.round(item.value)}
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
            textFontSize={(activeMessageFontSize)}
            timestamp="12 : 20"
            customStyle={getChatBubbleColor()}
            messageFrom={true}/>

            <ChatBubble
            disableTouch
            text="This is a sample response message"
            textFontSize={(activeMessageFontSize)}
            timestamp="12 : 21"
            customStyle={getChatBubbleColor()}
            messageFrom={false}/>
          </View>

          <View style={styles.colorChoiceContainer}>
            <Dropdown
            onChangeOption={index => {
              if(index != activeItem) {
                setOverrideColorChoiceSliderValue(true);
                setActiveItem(index);
              }
            }}
            choices={tabItems}
            textStyle={{fontSize : customStyle.scaledUIFontSize}}
            chosenStyle={{color : palette.primary}}
            containerStyle={{zIndex : 999}}
            dropDownBoxStyle={{borderRadius : 5}}
            />
            <ColorChoice
            overrideSliderValues={overrideColorChoiceSliderValue}
            color={tabItems[activeItem].color}
            onColorChange={color => tabItems[activeItem].setColor(color)}
            oldColor={clampRgb(customStyle[tabItems[activeItem].originalColor])}
            sliderTextSize={customStyle.scaledUIFontSize}
            sliderTitleSize={customStyle.scaledUIFontSize}
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
            onPress={() => setShowConfirmationModal(true)}
            disabled={checkStylesAreEqual(customStyle,defaultChatStyles)}
            buttonStyle={{ ...styles.button, marginLeft : 10, width : "45%"}}/>

          </View>
      </ScrollView>

      <ConfirmationModal
      visible={showConfirmationModal}
      onConfirm={async () => {
        await restoreDefaultStyles();
        setShowConfirmationModal(false);
      }}
      loading={restoringDefault}
      onCancel={() => setShowConfirmationModal(false)}
      confirmText="Restore"
      cancelText="Go Back"
      titleText="Are you sure you want to restore default styles?"
      />
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
