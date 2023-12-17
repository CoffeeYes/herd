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

const boundaryValues = {
  minFontSize : 16,
  maxFontSize : 24,
}

const defaultChatStyles = {
  sentBoxColor : palette.mediumgrey,
  sentTextColor : palette.offwhite,
  receivedBoxColor : palette.offprimary,
  receivedTextColor : palette.offwhite,
  messageFontSize : boundaryValues.minFontSize,
  titleSize : boundaryValues.maxFontSize,
  subTextSize : 14,
  uiFontSize : boundaryValues.minFontSize
}

export {
  largeImageContainerStyle,
  defaultChatStyles,
  boundaryValues
}
