import React from 'react';
import { View, Dimensions } from 'react-native';

import { palette } from '../assets/palette';

import { useScreenAdjustedSize } from '../helper';

const CameraMarker = ({ borderWidth = 5, color = palette.white }) => {

  const height = useScreenAdjustedSize(0.4,0.8,"height") + (2 * borderWidth);
  const width = useScreenAdjustedSize(0.8,0.4) + (2 * borderWidth);
  const markerWidth = useScreenAdjustedSize(0.2,0.1);

  const sharedStyles = {
    ...styles.border,
    width : markerWidth,
    height : markerWidth,
    borderColor : color
  }

  return (
    <View style={{
    justifyContent : "space-between",
    width : height,
    height : height}}>

      <View style={styles.row}>
        <View style={{
          ...sharedStyles,
          borderTopWidth : borderWidth,
          borderLeftWidth : borderWidth}}
        />

        <View style={{
          ...sharedStyles,
          borderTopWidth : borderWidth,
          borderRightWidth : borderWidth,
          alignSelf : "flex-end"}}
        />
      </View>

      <View style={styles.row}>
        <View style={{
          ...sharedStyles,
          borderBottomWidth : borderWidth,
          borderLeftWidth : borderWidth}}
        />

        <View style={{
          ...sharedStyles,
          borderBottomWidth : borderWidth,
          borderRightWidth : borderWidth,
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
