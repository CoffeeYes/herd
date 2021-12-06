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

export {
  largeImageContainerStyle
}
