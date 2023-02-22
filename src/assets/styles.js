import { Dimensions } from 'react-native';
import { palette } from './palette';

const largeImageContainerStyle = {
  alignSelf : "center",
  width : Dimensions.get("window").width * 0.4,
  height : Dimensions.get("window").width * 0.4,
  borderRadius : Dimensions.get("window").width * 0.2,
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
  fontSize : 16,
  titleSize : 24,
  subTextSize : 14,
  appFontSize : 16,
}

export {
  largeImageContainerStyle,
  defaultChatStyles
}
