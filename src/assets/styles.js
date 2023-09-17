import { Dimensions } from 'react-native';
import { palette } from './palette';

const largeImageContainerStyle = {
  alignSelf : "center",
  borderWidth : 1,
  borderColor : palette.grey,
  alignItems : "center",
  justifyContent : "center",
  overflow : "hidden",
  backgroundColor : palette.white,
  elevation : 2,
  marginBottom : 10
}

const defaultChatStyles = {
  sentBoxColor : palette.mediumgrey,
  sentTextColor : palette.offwhite,
  receivedBoxColor : palette.offprimary,
  receivedTextColor : palette.offwhite,
  messageFontSize : 16,
  titleSize : 24,
  subTextSize : 14,
  uiFontSize : 16
}

export {
  largeImageContainerStyle,
  defaultChatStyles
}
