import React from 'react';
import { ActivityIndicator } from 'react-native';
import FullScreenSplash from './FullScreenSplash';

import { palette } from '../assets/palette';

const LoadingScreen = () => {
  return (
    <FullScreenSplash title="Herd">
      <ActivityIndicator size="large" color={palette.primary}/>
    </FullScreenSplash>
  )
}

export default LoadingScreen;
