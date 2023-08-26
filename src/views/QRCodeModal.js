import React from 'react';
import { View, Text, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { useSelector } from 'react-redux';
import QRCode from 'react-native-qrcode-svg';
import CustomModal from './CustomModal';

import { palette } from '../assets/palette';
import { useScreenAdjustedSize } from '../helper';

const QRCodeModal = ({ visible, value, onPress, onRequestClose, title }) => {
  const customStyle = useSelector(state => state.chatReducer.styles);
  const qrCodeSize = useScreenAdjustedSize(Dimensions,0.75,0.35);
  return (
    <CustomModal
    visible={visible}
    onRequestClose={onRequestClose}
    onPress={onPress}>
      <View style={styles.modalContentContainer}>
        {title &&
        <View style={styles.header}>
          <Text style={{...styles.title,fontSize : customStyle.uiFontSize}}>{title}</Text>
        </View>}
        <View style={styles.QRContainer}>
          <QRCode
          value={JSON.stringify(value)}
          size={qrCodeSize}/>
        </View>
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
    alignItems : "center",
    maxWidth : Dimensions.get('window').width * 0.8,
    maxHeight : Dimensions.get('window').height * 0.8
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
