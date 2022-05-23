import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { View, Text, Button, Platform, Dimensions } from 'react-native';
import Crypto from '../nativeWrapper/Crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomButton from './CustomButton';

import { setPublicKey } from '../redux/actions/userActions'

const Splash = ({ navigation }) => {
  const dispatch = useDispatch();
  const [textWidth, setTextWidth] = useState(100);

  const setup = async () => {
    //generate keys
    await Crypto.generateRSAKeyPair('herdPersonal');
    const key = await Crypto.loadKeyFromKeystore("herdPersonal");
    dispatch(setPublicKey(key));

    //set default styling
    const style = {
      sentBoxColor : "#c6c6c6",
      sentTextColor : "#f5f5f5",
      receivedBoxColor : "#E86252",
      receivedTextColor : "#f5f5f5",
      fontSize : 14
    }

    await AsyncStorage.setItem("styles",JSON.stringify(style))

    navigation.navigate('main');

  }

  return (
    <View style={styles.mainContainer}>
      <View style={styles.contentContainer}>
      <Text style={{color : "white",marginBottom : 20}} onLayout={event => setTextWidth(event.nativeEvent.layout.width)}>
        Welcome to Herd, the peer-to-peer messaging app!
      </Text>

      <CustomButton
      text="Get Started"
      onPress={setup}
      buttonStyle={{borderWidth : 1,borderColor : "white"}}
      disabled={Platform.OS === "android" && Platform.Version < 23}/>

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
  mainContainer : {
    alignItems : "center",
    justifyContent : "center",
    backgroundColor : "#e05e3f",
    flex : 1
  },
  contentContainer : {
    width : Dimensions.get("window").width * 0.7,
    display : "flex",
    alignItems : "center"
  }
}
export default Splash;
