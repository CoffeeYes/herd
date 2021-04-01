import React from 'react';
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
      </TouchableOpacity>}
    </View>
  )
}

const styles = {
  title : {
    color : "white",
    marginLeft : 10,
  }
}

export default Header;
