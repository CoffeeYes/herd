import React from 'react';
import { useSelector } from 'react-redux';
import { TouchableOpacity, Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { palette } from '../assets/palette';
import LoadingIndicator from './LoadingIndicator';

const CustomButton = ({ onPress, rightIcon, rightIconSize = 24, leftIcon, leftIconSize,
                        text, buttonStyle, textStyle, disabled, disabledStyle, useDisabledStyle = true,
                        loading, useLoadingIndicator, loadingIndicatorColor, loadingIndicatorStyle,
                        loadingIndicatorSize }) => {
  const customStyle = useSelector(state => state.appStateReducer.styles);
  return (
    <TouchableOpacity
    onPress={onPress}
    style={{
      ...styles.button,
      ...buttonStyle,
      ...(disabled && useDisabledStyle && {...styles.disabled,...disabledStyle})
    }}
    disabled={disabled}>
      {leftIcon &&
      <Icon name={leftIcon} size={leftIconSize}/>}

      {useLoadingIndicator &&
      <LoadingIndicator
      animating={loading}
      size={loadingIndicatorSize}
      color={loadingIndicatorColor} 
      style={{...styles.loadingIndicator, ...loadingIndicatorStyle }}/>}

      {text &&
      <Text style={{...styles.buttonText,fontSize : customStyle.scaledUIFontSize, ...textStyle}}>
        {text}
      </Text>}

      {rightIcon &&
      <Icon name={rightIcon} size={rightIconSize}/>}
    </TouchableOpacity>
  )
}

const styles = {
  button : {
    backgroundColor : palette.primary,
    padding : 10,
    borderRadius : 5,
    alignSelf : "center",
    alignItems : "center",
    flexDirection : "row",
    borderWidth : 1,
    borderColor : palette.white
  },
  buttonText : {
    color : palette.white,
    fontWeight : "bold",
    fontFamily : "Open-Sans",
    textAlign : "center",
    marginLeft : "auto",
    marginRight : "auto"
  },
  disabled : {
    backgroundColor : palette.grey,
    borderColor : palette.grey
  },
  loadingIndicator : {
    position : "absolute",
    marginLeft : "5%",
  }
}

export default CustomButton;
