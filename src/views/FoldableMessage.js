import React, { memo } from 'react';
import { View, Text, TouchableOpacity, } from 'react-native';

import { palette } from '../assets/palette';

import LoadingBar from './LoadingBar';

const componentShouldUpdate = (props, nextProps) => {
  for(const key of Object.keys(props)) {
    if(typeof props[key] !== "function" && typeof props[key] != "object" && props[key] !== nextProps[key]) {
      return false;
    }
  }
  return true;
}

const HeaderItem = ({title, text, numberOfLines, containerStyle, titleStyle, textStyle}) => {
  return (
    <View style={containerStyle}>
      {title?.toString().length > 0 &&
      <Text numberOfLines={numberOfLines} style={titleStyle}>{title}</Text>}

      {text?.toString().length > 0 &&
      <Text numberOfLines={numberOfLines} style={textStyle}>{text}</Text>}
    </View>
  )
}

const FoldableMessage = ({open, to = "N/A", from = "N/A", closedTimestamp, text, textFontSize, onPress, loading,
                          openTimestamp, containerStyle, headerTitleStyle, headerTextStyle, headerNumberOfLines = 1, openTimestampStyle, disablePress, pauseLoadingIndicator}) => {
  return (
    <TouchableOpacity style={{...styles.container, paddingBottom : open ? 0 : 20, ...containerStyle}} onPress={onPress} disabled={disablePress}>
      <View style={{width : "100%"}}>
        {loading ?
        <LoadingBar paused={pauseLoadingIndicator} numBars={2} barColor="rgba(0,0,0,0.1)" sliderColor="rgba(0,0,0,0.1)"/>
        :
        <>
          <View style={styles.messageHeader}>
            <HeaderItem
            title="From:"
            text={from}
            numberOfLines={headerNumberOfLines}
            containerStyle={styles.headerTextContainer}
            titleStyle={{fontWeight : "bold", ...headerTitleStyle}}
            textStyle={headerTextStyle}/>

            <HeaderItem
            title="To:"
            text={to}
            numberOfLines={headerNumberOfLines}
            containerStyle={styles.headerTextContainer}
            titleStyle={{fontWeight : "bold", ...headerTitleStyle}}
            textStyle={headerTextStyle}/>

            <HeaderItem
            text={closedTimestamp}
            numberOfLines={headerNumberOfLines}
            containerStyle={{...styles.headerTextContainer, alignSelf : "center", alignItems : "flex-end"}}
            textStyle={headerTextStyle}/>

          </View>

          {open &&
          <View style={styles.messageText}>
            <Text style={{fontSize : textFontSize}}>{text}</Text>
            <Text style={{
              alignSelf : "flex-end",
              fontSize : textFontSize,
              ...openTimestampStyle
            }}>
              {openTimestamp}
            </Text>
          </View>}
          
        </>}
      </View>
    </TouchableOpacity>
  )
}

const styles = {
  messageHeader : {
    flexDirection : "row",
    justifyContent : "space-around",
    width : "100%",
    paddingHorizontal : 20,
    overflow : "hidden"
  },
  headerTextContainer : {
    width : "30%",
  },
  messageText : {
    marginTop : 10,
    width : "100%",
    backgroundColor : palette.offgrey,
    padding : 20,
  },
  container : {
    flexDirection : "row",
    backgroundColor : palette.white,
    paddingVertical : 20,
    marginVertical : 5,
    borderRadius : 10,
    elevation : 2
  },
}

export default memo(FoldableMessage,componentShouldUpdate);
