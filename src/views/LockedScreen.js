import React from 'react';
import { View, Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FullScreenSplash from './FullScreenSplash';

const LockedScreen = () => {
  return (
    <FullScreenSplash title={"Herd"}>
      <Icon name="lock" size={72}/>
    </FullScreenSplash>
  )
}

export default LockedScreen;
