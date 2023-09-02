import React from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { useSelector } from 'react-redux'
import Icon from 'react-native-vector-icons/MaterialIcons';
import navigationRef from '../NavigationRef'

import { palette } from '../assets/palette';

import { useScreenAdjustedSize } from '../helper';

const Header = ({ title, allowGoBack, rightButtonIcon, rightButtonOnClick, preText,
                  onTextTouch, touchStyle, containerStyle, textStyle, backArrowSize,
                  backArrowStyle, rightIconSize }) => {
  const customStyle = useSelector(state => state.chatReducer.styles);
  const headerHeight = useScreenAdjustedSize(0.085,0.2,"height");
  const rightButtonWidth = useScreenAdjustedSize(0.2,0.15);
  return (
    <View style={{...styles.container,...containerStyle,height : headerHeight}}>
      {allowGoBack &&
        <TouchableOpacity onPress={() => navigationRef.current.goBack()} style={{paddingVertical : 15}}>
          <Icon name="arrow-back" size={backArrowSize || customStyle.uiFontSize + 16} style={{...styles.backArrow,...backArrowStyle}}/>
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
      style={{...styles.rightButton,width : rightButtonWidth}}>
        <Icon name={rightButtonIcon} size={rightIconSize || customStyle.uiFontSize + 16} style={{color : palette.white}}/>
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
    height : "100%",
    alignItems : "center",
    justifyContent : "center",
    width : Dimensions.get("window").width * 0.20,
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
