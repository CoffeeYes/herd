import React from 'react';
import { View, Text, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { useSelector } from 'react-redux';
import QRCode from 'react-native-qrcode-svg';
import CustomModal from './CustomModal';

import { palette } from '../assets/palette';

const determineSize = () => {
  const { height, width } = Dimensions.get("window");
  //determine size based on portrait or landscape orientation
  if(height > width) {
    return width * 0.75;
  }
  else {
    return width * 0.35;
  }
}

const QRCodeModal = ({ visible, value, onPress, onRequestClose, title }) => {
  const customStyle = useSelector(state => state.chatReducer.styles);
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
          size={determineSize()}/>
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
