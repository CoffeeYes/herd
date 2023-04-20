import React from 'react';
import { View, Dimensions } from 'react-native';

import { palette } from '../assets/palette';

const CameraMarker = ({ borderWidth = 5, borderColor = palette.white }) => {

  const sharedStyles = {
    ...styles.border,
    borderColor : borderColor
  }

  const width = borderWidth;

  return (
    <View style={{
    justifyContent : "space-between",
    width : Dimensions.get("window").width * 0.8,
    height : Dimensions.get("window").height * 0.4}}>

      <View style={styles.row}>
        <View style={{
          ...sharedStyles,
          borderTopWidth : width,
          borderLeftWidth : width}}
        />

        <View style={{
          ...sharedStyles,
          borderTopWidth : width,
          borderRightWidth : width,
          alignSelf : "flex-end"}}
        />
      </View>

      <View style={styles.row}>
        <View style={{
          ...sharedStyles,
          borderBottomWidth : width,
          borderLeftWidth : width}}
        />

        <View style={{
          ...sharedStyles,
          borderBottomWidth : width,
          borderRightWidth : width,
          alignSelf : "flex-end"}}
        />
      </View>

    </View>
  )
}

const styles = {
  border : {
    width : Dimensions.get("window").width * 0.2,
    height : Dimensions.get("window").width * 0.2,
  },
  row : {
    flexDirection : "row",
    justifyContent : "space-between"
  }
}

export default CameraMarker
