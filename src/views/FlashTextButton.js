import React, { useState } from 'react';
import CustomButton from './CustomButton';

import { palette } from '../assets/palette';

const FlashTextButton = ({ onPress, flashText, normalText,
                           timeout, buttonStyle, textStyle, disabled,
                           disabledStyle, loading = false, loadingColor = palette.secondary,
                           loadingSize = 24}) => {
  const [buttonText, setButtonText] = useState(normalText)

  const onButtonPress = async () => {
    const success = await onPress();
    if(success && flashText?.length > 0 && timeout > 0) {
      setButtonText(flashText);
      setTimeout(() => {
        setButtonText(normalText);
      },timeout)
    }
  }

  return (
    <CustomButton
    disabled={disabled}
    disabledStyle={disabledStyle}
    onPress={async () => await onButtonPress()}
    text={buttonText + " "}
    loading={loading}
    useLoadingIndicator
    loadingIndicatorSize={loadingSize}
    loadingIndicatorColor={loadingColor}
    buttonStyle={buttonStyle}
    textStyle={textStyle}
    />
  )
}

export default FlashTextButton;
