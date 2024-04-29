import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { ScrollView, Text, Platform, Dimensions } from 'react-native';
import Crypto from '../nativeWrapper/Crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomButton from './CustomButton';
import FullScreenSplash from './FullScreenSplash';

import { setPublicKey } from '../redux/actions/userActions'

import { defaultChatStyles } from '../assets/styles';

import { palette } from '../assets/palette';
import { CommonActions } from '@react-navigation/native';

const Splash = ({ navigation }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const setup = async () => {
    setLoading(true);
    //generate keys
    await Crypto.generateRSAKeyPair('herdPersonal');
    const key = await Crypto.loadKeyFromKeystore("herdPersonal");
    dispatch(setPublicKey(key));

    //set default styling
    await AsyncStorage.setItem("styles",JSON.stringify(defaultChatStyles));
    setLoading(false);
    
    navigation.dispatch(CommonActions.reset({
      index : 1,
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
        loadingIndicatorColor={palette.white}
        loadingIndicatorStyle={{marginLeft : "1%"}}
        loading={loading}
        buttonStyle={styles.button}
        disabledStyle={styles.button}
        textStyle={{marginLeft : "7%"}}
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
    paddingRight : "7%"
  }
}
export default Splash;
