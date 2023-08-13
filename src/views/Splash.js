import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { ScrollView, Text, Button, Platform, Dimensions } from 'react-native';
import Crypto from '../nativeWrapper/Crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomButton from './CustomButton';
import FullScreenSplash from './FullScreenSplash';

import { setPublicKey } from '../redux/actions/userActions'

import { defaultChatStyles } from '../assets/styles';

import { palette } from '../assets/palette';

const Splash = ({ navigation }) => {
  const dispatch = useDispatch();

  const setup = async () => {
    //generate keys
    await Crypto.generateRSAKeyPair('herdPersonal');
    const key = await Crypto.loadKeyFromKeystore("herdPersonal");
    dispatch(setPublicKey(key));

    //set default styling
    await AsyncStorage.setItem("styles",JSON.stringify(defaultChatStyles));

    navigation.navigate('main');

  }

  const badVersion = Platform.OS === "android" && Platform.Version < 23;
  return (
    <FullScreenSplash
    containerStyle={styles.mainContainer}>
      <ScrollView contentContainerStyle={styles.contentContainer}>

        <Text style={{color : palette.white,marginBottom : 20}}>
          Welcome to Herd, the peer-to-peer messaging app!
        </Text>

        <CustomButton
        text="Get Started"
        onPress={setup}
        buttonStyle={{borderWidth : 1,borderColor : palette.white}}
        disabled={badVersion}/>

        {badVersion &&
        <Text style={{color : palette.white, marginTop : 20, fontWeight : "bold"}}>
          Unfortunately, your device's software is too old to utilise the security features herd requires to run.
          Please check for software updates. If there are none, herd will not function with your device.
        </Text>}

      </ScrollView>
    </FullScreenSplash>
  )
}

const styles = {
  mainContainer : {
    alignItems : "center",
    justifyContent : "center",
    backgroundColor : palette.primary,
    flex : 1
  },
  contentContainer : {
    width : Dimensions.get("window").width * 0.8,
    justifyContent : "center",
    alignItems : "center",
    flex : 1,
  }
}
export default Splash;
