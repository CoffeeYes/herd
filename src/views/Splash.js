import React from 'react';
import { View, Text, Button } from 'react-native';
import palette from '../assets/palette.js';
import Crypto from '../nativeWrapper/Crypto';

const Splash = ({ navigation }) => {

  const setup = async () => {
    await Crypto.generateRSAKeyPair('herdPersonal');
    navigation.navigate('main')
  }
  
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
      onPress={setup}
      />
    </View>
  )
}

export default Splash;
