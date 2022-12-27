import { Dimensions } from 'react-native';

const largeImageContainerStyle = {
  alignSelf : "center",
  width : Dimensions.get("window").width * 0.4,
  height : Dimensions.get("window").width * 0.4,
  borderRadius : Dimensions.get("window").width * 0.2,
  borderWidth : 1,
  borderColor : "grey",
  alignItems : "center",
  justifyContent : "center",
  overflow : "hidden",
  backgroundColor : "white",
  elevation : 2,
  marginBottom : 10
}

const defaultChatStyles = {
  sentBoxColor : "#c6c6c6",
  sentTextColor : "#f5f5f5",
  receivedBoxColor : "#E86252",
  receivedTextColor : "#f5f5f5",
  fontSize : 14
}

export {
  largeImageContainerStyle,
  defaultChatStyles
}
