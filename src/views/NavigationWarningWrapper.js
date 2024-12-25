import React, { useEffect, useState, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';

import ConfirmationModal from './ConfirmationModal';

const defaultTitle = 'You have unsaved changes. Are you sure to discard them and leave the screen?';

const NavigationWarningWrapper = ({ children, checkForChanges, 
                                    confirmationText = "Discard", cancelText = "Stay",
                                    alertTitle = defaultTitle, onConfirm,
                                    onCancel = () => {}
                                  }) => {

  const navigation = useNavigation();
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const eventRef = useRef();

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
        setShowConfirmationModal(true);
        eventRef.current = e;
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
      <ConfirmationModal
      visible={showConfirmationModal}
      onConfirm={() => {
        setShowConfirmationModal(false);
        onConfirm ? onConfirm(eventRef.current) : defaultConfirmation(eventRef.current)
      }}
      onCancel={() => {
        setShowConfirmationModal(false);
        onCancel()
      }}
      confirmText={confirmationText}
      cancelText={cancelText}
      titleText={alertTitle}/>
    </>
  )
}

export default NavigationWarningWrapper;
