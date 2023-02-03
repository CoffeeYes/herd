import React from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import navigationRef from '../NavigationRef'

import { palette } from '../assets/palette';

const Header = ({ title, allowGoBack, rightButtonIcon, rightButtonOnClick, preText,
                  onTextTouch, touchStyle, containerStyle, textStyle, backArrowSize = 30,
                  backArrowStyle, rightIconSize = 20 }) => {
  return (
    <View style={{...styles.container,...containerStyle}}>
      {allowGoBack &&
        <TouchableOpacity onPress={() => navigationRef.current.goBack()} style={{paddingVertical : 15}}>
          <Icon name="arrow-back" size={backArrowSize} style={{...styles.backArrow,...backArrowStyle}}/>
        </TouchableOpacity>}

        <TouchableOpacity
        disabled={!onTextTouch}
        onPress={onTextTouch}
        style={{...styles.pressContainer,...touchStyle}}>
          {preText}
          <Text style={{...styles.title,...textStyle}}>{title}</Text>
        </TouchableOpacity>


      {rightButtonIcon?.length > 0 && rightButtonOnClick &&
      <TouchableOpacity
      onPress={rightButtonOnClick}
      style={styles.rightButton}>
        <Icon name={rightButtonIcon} size={rightIconSize} style={{color : palette.white}}/>
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
    height : Dimensions.get("window").height * 0.085
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
