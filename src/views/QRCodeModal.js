import React from 'react';
import { View, Text, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { useSelector } from 'react-redux';
import QRCode from 'react-native-qrcode-svg';
import CustomModal from './CustomModal';

import { palette } from '../assets/palette';
import { useScreenAdjustedSize } from '../helper';

const QRCodeModal = ({ visible, value, onPress, onRequestClose, title }) => {
  const customStyle = useSelector(state => state.chatReducer.styles);
  const qrCodeSize = useScreenAdjustedSize(0.7,0.5);
  const maxContainerHeight = useScreenAdjustedSize(0.8,0.8,"height", false);
  const maxContainerWidth = useScreenAdjustedSize(0.8,0.8);
  
  return (
    <CustomModal
    visible={visible}
    onRequestClose={onRequestClose}
    onPress={onPress}>
      <View style={{
        ...styles.modalContentContainer,
        maxHeight : maxContainerHeight,
        maxWidth : maxContainerWidth
      }}>
        {title &&
        <View style={styles.header}>
          <Text style={{...styles.title,fontSize : customStyle.uiFontSize}}>{title}</Text>
        </View>}
        <QRCode
        value={JSON.stringify(value)}
        size={qrCodeSize}/>
      </View>
    </CustomModal>
  )
}

const styles = {
  button : {
    backgroundColor : palette.primary,
    padding : 10,
    alignSelf : "center",
    marginTop : 10,
    borderRadius : 5
  },
  buttonText : {
    color : palette.white,
    fontWeight : "bold",
    fontFamily : "Open-Sans",
    textAlign : "center"
  },
  modalMainContainer : {
    alignItems : "center",
    justifyContent : "center",
    flex : 1,
    backgroundColor : "rgba(0,0,0,0.4)"
  },
  modalContentContainer : {
    backgroundColor : palette.white,
    borderRadius : 5,
    padding : 20,
    alignItems : "center"
  },
  header : {
    marginBottom : 10
  },
  title : {
    fontSize : 18,
    fontWeight : "bold"
  }
}

export default QRCodeModal
