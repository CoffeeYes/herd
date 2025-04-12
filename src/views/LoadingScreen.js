import React from 'react';
import FullScreenSplash from './FullScreenSplash';

import LoadingIndicator from './LoadingIndicator';

const LoadingScreen = () => {
  return (
    <FullScreenSplash title="Herd">
      <LoadingIndicator/>
    </FullScreenSplash>
  )
}

export default LoadingScreen;
