import React, { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';

import { Alert } from 'react-native';

const defaultTitle = 'Discard Changes?'
const defaultSubtitle = 'You have unsaved changes. Are you sure to discard them and leave the screen?';

const NavigationWarningWrapper = ({ children, checkForChanges, 
                                    confirmationText = "Discard", cancelText = "Stay",
                                    alertTitle = defaultTitle, alertSubtitle = defaultSubtitle, onConfirm,
                                    onCancel = () => {}
                                  }) => {

  const navigation = useNavigation();

  const defaultConfirmation = e => {
    navigation.dispatch(e.data.action)
  }

  useEffect(() => {
    const beforeGoingBack = navigation.addListener('beforeRemove', async (e) => {
      if(e.data.action.type !== "GO_BACK") {
        return;
      }
      e.preventDefault();

      if(await checkForChanges?.()) {
        Alert.alert(
          alertTitle,
          alertSubtitle,
          [
            {
              text: confirmationText,
              style: 'destructive',
              // If the user confirmed, then we dispatch the action we blocked earlier
              // This will continue the action that had triggered the removal of the screen
              onPress: () =>  onConfirm ? onConfirm(e) : defaultConfirmation(e),
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
