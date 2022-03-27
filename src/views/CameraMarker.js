import React from 'react';
import { View, Dimensions } from 'react-native';

const CameraMarker = ({ borderWidth, borderColor }) => {
  return (
    <View style={{
    justifyContent : "space-between",
    width : Dimensions.get("window").width * 0.8,
    height : Dimensions.get("window").height * 0.4}}>

      <View style={{
      flexDirection : "row",
      justifyContent : "space-between"}}>

        <View style={{
          borderTopWidth : borderWidth,
          borderLeftWidth : borderWidth,
          borderTopColor : borderColor,
          borderLeftColor : borderColor,
          width : Dimensions.get("window").width * 0.2,
          height : Dimensions.get("window").width * 0.2}}
        />

        <View style={{
          borderTopWidth : borderWidth,
          borderRightWidth : borderWidth,
          borderTopColor : borderColor,
          borderRightColor : borderColor,
          alignSelf : "flex-end",
          width : Dimensions.get("window").width * 0.2,
          height : Dimensions.get("window").width * 0.2}}
        />
      </View>

      <View style={{
      flexDirection : "row",
      justifyContent : "space-between"}}>

        <View style={{
          borderBottomWidth : borderWidth,
          borderLeftWidth : borderWidth,
          borderBottomColor : borderColor,
          borderLeftColor : borderColor,
          width : Dimensions.get("window").width * 0.2,
          height : Dimensions.get("window").width * 0.2}}
        />

        <View style={{
          borderBottomWidth : borderWidth,
          borderRightWidth : borderWidth,
          borderBottomColor : borderColor,
          borderRightColor : borderColor,
          alignSelf : "flex-end",
          width : Dimensions.get("window").width * 0.2,
          height : Dimensions.get("window").width * 0.2}}
        />
      </View>
    </View>
  )
}

export default CameraMarker
