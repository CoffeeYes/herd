import React from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import navigationRef from '../NavigationRef'

const Header = ({ title, allowGoBack, rightButtonIcon, rightButtonOnClick, preText, onTextTouch }) => {
  return (
    <View style={{
    ...styles.container,
    paddingVertical : rightButtonIcon && rightButtonIcon.length > 0 ? 0 : 15}}>
      {allowGoBack &&
      <TouchableOpacity onPress={() => navigationRef.current.goBack()}>
        <Icon name="arrow-back" size={30} style={{color : "#EEEBD0", marginRight : 10}}/>
      </TouchableOpacity>}

      {onTextTouch ?
        <TouchableOpacity onPress={onTextTouch} style={styles.pressContainer}>
          {preText}
          <Text style={styles.title}>{title}</Text>
        </TouchableOpacity>
        :
        <>
          {preText}
          <Text style={styles.title}>{title}</Text>
        </>
      }


      {rightButtonIcon && rightButtonIcon.length > 0 && rightButtonOnClick &&
      <TouchableOpacity
      onPress={rightButtonOnClick}
      style={styles.rightButton}>
        <Icon name={rightButtonIcon} size={20} style={{color : "white"}}/>
      </TouchableOpacity>}
    </View>
  )
}

const styles = {
  container : {
    flexDirection : "row",
    justifyContent : "space-between",
    alignItems : "center",
    backgroundColor : "#e05e3f",
    paddingLeft : 20,
  },
  title : {
    color : "white",
    fontSize : 18,
    marginRight : "auto"
  },
  rightButton : {
    backgroundColor : "#EBB3A9",
    paddingVertical : 15,
    paddingHorizontal : Dimensions.get("window").width * 0.05
  },
  pressContainer : {
    marginRight : "auto",
  }
}

export default Header;
