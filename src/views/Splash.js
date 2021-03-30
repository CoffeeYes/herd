import React, { useState } from 'react';
import { View, Text, Button, Platform, Dimensions } from 'react-native';
import palette from '../assets/palette.js';
import Crypto from '../nativeWrapper/Crypto';

const Splash = ({ navigation }) => {
  const [textWidth, setTextWidth] = useState(100);

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
      <View style={styles.contentContainer}>
      <Text style={{color : "white",marginBottom : 20}} onLayout={event => setTextWidth(event.nativeEvent.layout.width)}>
        Welcome to Herd, the peer-to-peer messaging app!
      </Text>
      <Button
      title="Get Started"
      color={palette.secondary}
      onPress={setup}
      disabled={Platform.OS === "android" && Platform.Version < 23}
      />
      {Platform.OS === "android" && Platform.Version < 23 &&
        <Text style={{color : "white", marginTop : 20, fontWeight : "bold", width : textWidth}}>
          Unfortunately, your device's software is too old to utilise the security features herd requires to run.
          Please check for software updates. If there are none, herd will not function with your device.
        </Text>
      }
      </View>
    </View>
  )
}

const styles = {
  contentContainer : {
    width : Dimensions.get("window").width * 0.7,
    display : "flex",
    alignItems : "center"
  }
}
export default Splash;
