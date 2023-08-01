import React, { useEffect } from 'react';

import { View, Alert } from 'react-native';

const NavigationWarningWrapper = ({ children, checkForChanges, navigation, confirmationText = "",
                                    cancelText = "", alertTitle = "", alertSubtitle = "",
                                    onConfirm, onCancel}) => {

  useEffect(() => {
    const beforeGoingBack = navigation.addListener('beforeRemove', async (e) => {
      e.preventDefault();

      if(checkForChanges()) {
        Alert.alert(
          alertTitle,
          alertSubtitle,
          [
            {
              text: confirmationText,
              style: 'destructive',
              // If the user confirmed, then we dispatch the action we blocked earlier
              // This will continue the action that had triggered the removal of the screen
              onPress: () => onConfirm(e),
            },
            { text: cancelText, style: 'cancel', onPress: () => onCancel(e) },
          ]
        );
      }
      else {
        navigation.dispatch(e.data.action);
      }
    })

    return beforeGoingBack;
  },[navigation])

  return (
    <>
      {children}
    </>
  )
}

export default NavigationWarningWrapper;
