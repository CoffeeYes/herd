import React, { useState }  from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux'
import Icon from 'react-native-vector-icons/MaterialIcons';

import { palette } from '../assets/palette';

import { useScreenAdjustedSize } from '../helper';
import { defaultChatStyles } from '../assets/styles'
import { useIsFocused } from '@react-navigation/native';

const Header = ({ title, allowGoBack, rightButtonIcon, rightButtonOnClick, disableRightButton, disableBackButton,
                  preText, onTextLayout, 
                  onTextTouch, disableTextTouch = false, touchStyle, containerStyle, textStyle, backArrowSize,
                  backArrowStyle, rightIconSize, limitTitleLines = true, titleNumberOfLines = 1,
                  useAlternativeIcon, alternativeIcon}) => {
  const navigation = useNavigation();
  const customStyle = useSelector(state => state.chatReducer.styles);
  const minimumHeight = useScreenAdjustedSize(0.1,0.2, "height",1,0.7,1000,1000);
  const rightButtonWidth = useScreenAdjustedSize(0.2,0.15);
  const leftButtonWidth = useScreenAdjustedSize(0.2,0.1, "width", 0.7, 0.7, 1000, 1000);
  const leftIconSize = useScreenAdjustedSize(0.05,0.025,"width",0.7,1,1000,1000)
  const scaledIconSize = ((customStyle.uiFontSize + 16) / defaultChatStyles.uiFontSize) * leftIconSize

  const isFocused = useIsFocused();
  const [showBackButton, setShowBackButton] = useState(allowGoBack && navigation.canGoBack() && isFocused)

  return (
    <View
    style={{
      ...styles.container,
      minHeight : minimumHeight, 
      ...(!showBackButton && {paddingLeft : 10}),
      ...containerStyle
    }}>

      {showBackButton &&
      <>
      <TouchableOpacity style={{width : 1}}>
        <Text></Text>
      </TouchableOpacity>
      <TouchableOpacity
      disabled={disableBackButton}
      onPress={() => navigation.goBack()}
      style={{...styles.leftButton, paddingVertical : 15, alignItems : "center",width : leftButtonWidth}}>
        <Icon name="arrow-back" size={backArrowSize || scaledIconSize} style={{...styles.backArrow,...backArrowStyle}}/>
      </TouchableOpacity>
      </>}

      <TouchableOpacity
      disabled={!onTextTouch || disableTextTouch}
      onPress={onTextTouch}
      style={{...styles.pressContainer,...touchStyle}}>
        {preText}
        <Text
        onTextLayout={onTextLayout}
        {...(limitTitleLines && {numberOfLines : titleNumberOfLines})}
        style={{...styles.title, fontSize : customStyle.scaledTitleSize,...textStyle}}>{title}</Text>
      </TouchableOpacity>

      {rightButtonIcon?.length > 0 && rightButtonOnClick &&
      <TouchableOpacity
      disabled={disableRightButton}
      onPress={rightButtonOnClick}
      style={{...styles.rightButton,width : rightButtonWidth}}>
        {useAlternativeIcon ?
        alternativeIcon
        :
        <Icon name={rightButtonIcon} size={rightIconSize || scaledIconSize} style={{color : palette.white}}/>}
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
  },
  title : {
    flex : 1,
    color : palette.white,
    fontSize : 18,
    marginRight : "auto",
    maxWidth : "95%"
  },
  leftButton : {
    alignItems : "center",
    justifyContent : "center",
    alignSelf : "stretch"
  },
  rightButton : {
    backgroundColor : palette.secondary,
    alignItems : "center",
    justifyContent : "center",
    maxWidth : 150,
    alignSelf : "stretch"
  },
  pressContainer : {
    flex : 1,
    height : "100%",
    justifyContent : "center",
    flexDirection : "row",
    alignItems : "center",
  },
  backArrow : {
    color : palette.white,
    marginRight : 10
  }
}

export default Header;
