import React from 'react';
import { View, Text, Button } from 'react-native';
import palette from '../assets/palette.js'

const Splash = ({ navigation }) => {
  return (
    <View style={{
      alignItems : "center",
      justifyContent : "center",
      backgroundColor : "#e05e3f",
      flex : 1}}>
      <Text style={{color : "white",marginBottom : 20}}>
        Welcome to Herd, the peer-to-peer messaging app!
      </Text>
      <Button
      title="Get Started"
      color={palette.secondary}
      onPress={() => navigation.navigate('chooseUsername')}
      />
    </View>
  )
}

export default Splash;
