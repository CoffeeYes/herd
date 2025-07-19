import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { ScrollView, Text, Platform, Dimensions } from 'react-native';
import Crypto from '../nativeWrapper/Crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomButton from './CustomButton';
import FullScreenSplash from './FullScreenSplash';

import { setPublicKey } from '../redux/actions/userActions'

import { defaultChatStyles } from '../assets/styles';

import ServiceInterface from '../nativeWrapper/ServiceInterface.js'

import { palette } from '../assets/palette';
import { CommonActions } from '@react-navigation/native';
import { setEnableNotifications, setMaxPasswordAttempts } from '../redux/actions/appStateActions';
import { STORAGE_STRINGS } from '../common';
import { useScreenAdjustedSize } from '../helper';

const defaultMaxPasswordAttempts = 3;

const Splash = ({ navigation }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const buttonWidth = useScreenAdjustedSize(0.4,0.4);

  const setup = async () => {
    setLoading(true);
    //generate keys
    await Crypto.generateRSAKeyPair('herdPersonal');
    const key = await Crypto.loadKeyFromKeystore("herdPersonal");
    dispatch(setPublicKey(key));

    //check that notification perms are enabled on native side
    const nativeNotificationsEnabled = await ServiceInterface.notificationsAreEnabled();

    //set default styling
    await AsyncStorage.setItem(STORAGE_STRINGS.STYLES,JSON.stringify(defaultChatStyles));
    await AsyncStorage.setItem(STORAGE_STRINGS.MAX_PASSWORD_ATTEMPTS,defaultMaxPasswordAttempts.toString());
    await AsyncStorage.setItem(STORAGE_STRINGS.ENABLE_NOTIFICATIONS,nativeNotificationsEnabled.toString());
    dispatch(setMaxPasswordAttempts(defaultMaxPasswordAttempts));
    dispatch(setEnableNotifications(nativeNotificationsEnabled));
    setLoading(false);

    await AsyncStorage.setItem(STORAGE_STRINGS.SETUP_COMPLETE, JSON.stringify(true));
    
    navigation.dispatch(CommonActions.reset({
      index : 0,
      routes : [
        {name : "main"}
      ]
    }))
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
        onPress={async () => await setup()}
        useLoadingIndicator
        replaceTextWithLoadingIndicator
        loadingIndicatorColor={palette.white}
        loading={loading}
        buttonStyle={{...styles.button,width : buttonWidth, minHeight : 60}}
        disabledStyle={styles.button}
        disabled={badVersion || loading}/>

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
  },
  button : {
    borderWidth : 1,
    borderColor : palette.white,
    justifyContent : "center"
  }
}
export default Splash;
