import React from 'react';
<<<<<<< HEAD
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import navigationRef from '../NavigationRef'

const Header = ({ title, allowGoBack, rightButtonIcon, rightButtonOnClick }) => {
  return (
    <View style={{
    ...styles.container,
    paddingVertical : rightButtonIcon && rightButtonIcon.length > 0 ? 0 : 15}}>
      {allowGoBack &&
      <TouchableOpacity onPress={() => navigationRef.current.goBack()}>
        <Icon name="arrow-back" size={24} style={{color : "blue"}}/>
      </TouchableOpacity>}

      <Text style={styles.title}>{title}</Text>

      {rightButtonIcon && rightButtonIcon.length > 0 && rightButtonOnClick &&
      <TouchableOpacity
      onPress={rightButtonOnClick}
      style={styles.rightButton}>
        <Icon name={rightButtonIcon} size={20} style={{color : "white"}}/>
=======
import { View, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import navigationRef from '../NavigationRef'

const Header = ({ title, rightButtonIcon, rightButtonOnClick }) => {
  return (
    <View style={{backgroundColor : "#E86252", padding : 15, flexDirection : "row", alignItems : "center"}}>
      <TouchableOpacity onPress={() => navigationRef.current.goBack()}>
        <Icon name="arrow-back" size={24} style={{color : "blue"}}/>
      </TouchableOpacity>

      <Text style={styles.title}>{title}</Text>

      {rightButtonIcon && rightButtonOnClick &&
      <TouchableOpacity onPress={rightButtonOnClick}>
        <Icon name={rightButtonIcon} size={24} style={{color : "white"}}/>
>>>>>>> 789a0794dc5cc49c85f5ebedae5d769060efb900
      </TouchableOpacity>}
    </View>
  )
}

const styles = {
<<<<<<< HEAD
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
=======
  title : {
    color : "white",
    marginLeft : 10,
>>>>>>> 789a0794dc5cc49c85f5ebedae5d769060efb900
  }
}

export default Header;
