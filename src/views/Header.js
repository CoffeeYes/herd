import React from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { useSelector } from 'react-redux'
import Icon from 'react-native-vector-icons/MaterialIcons';
import navigationRef from '../NavigationRef'

import { palette } from '../assets/palette';

import { useScreenAdjustedSize } from '../helper';
import { defaultChatStyles } from '../assets/styles'

const Header = ({ title, allowGoBack, rightButtonIcon, rightButtonOnClick, preText,
                  onTextTouch, touchStyle, containerStyle, textStyle, backArrowSize,
                  backArrowStyle, rightIconSize }) => {
  const customStyle = useSelector(state => state.chatReducer.styles);
  const minimumHeight = useScreenAdjustedSize(0.1,0.2, "height",1,0.7,1000,1000);
  const rightButtonWidth = useScreenAdjustedSize(0.2,0.15);
  const leftButtonWidth = useScreenAdjustedSize(0.1,0.1);
  const leftIconSize = useScreenAdjustedSize(0.05,0.025,"width",0.7,1,1000,1000)
  const scaledIconSize = ((customStyle.uiFontSize + 16) / defaultChatStyles.uiFontSize) * leftIconSize

  return (
    <View style={{...styles.container,minHeight : minimumHeight, ...containerStyle}}>
      {allowGoBack &&
      <TouchableOpacity
      onPress={() => navigationRef.current.goBack()}
      style={{paddingVertical : 15, alignItems : "center",}}>
        <Icon name="arrow-back" size={backArrowSize || scaledIconSize} style={{...styles.backArrow,...backArrowStyle}}/>
      </TouchableOpacity>}

      <TouchableOpacity
      disabled={!onTextTouch}
      onPress={onTextTouch}
      style={{...styles.pressContainer,...touchStyle}}>
        {preText}
        <Text style={{...styles.title, fontSize : customStyle.titleSize,...textStyle}}>{title}</Text>
      </TouchableOpacity>


      {rightButtonIcon?.length > 0 && rightButtonOnClick &&
      <TouchableOpacity
      onPress={rightButtonOnClick}
      style={{...styles.rightButton,width : rightButtonWidth,minHeight : minimumHeight}}>
        <Icon name={rightButtonIcon} size={rightIconSize || scaledIconSize} style={{color : palette.white}}/>
      </TouchableOpacity>}
    </View>
  )
}

const styles = {
  container : {
    flexDirection : "row",
    justifyContent : "space-between",
    alignItems : "center",
    backgroundColor : palette.primary,
    paddingLeft : 10,
  },
  title : {
    color : palette.white,
    fontSize : 18,
    marginRight : "auto"
  },
  rightButton : {
    backgroundColor : palette.secondary,
    alignItems : "center",
    justifyContent : "center",
    maxWidth : 150
  },
  pressContainer : {
    flex : 1,
    height : "100%",
    justifyContent : "center",
    flexDirection : "row",
    alignItems : "center"
  },
  backArrow : {
    color : palette.white,
    marginRight : 10
  }
}

export default Header;
