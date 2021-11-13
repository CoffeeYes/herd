import React from 'react';
import { View, Text, Modal, TouchableOpacity, Dimensions } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import CustomModal from './CustomModal';

const QRCodeModal = ({ visible, value, setVisible, title }) => {
  return (
    <CustomModal
    visible={visible}
    setVisible={setVisible}>
      <View style={styles.modalContentContainer}>
        {title &&
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
        </View>}
        <View style={styles.QRContainer}>
          <QRCode
          value={JSON.stringify(value)}
          size={300}/>
        </View>
      </View>
    </CustomModal>
  )
}

const styles = {
  button : {
    backgroundColor : "#E86252",
    padding : 10,
    alignSelf : "center",
    marginTop : 10,
    borderRadius : 5
  },
  buttonText : {
    color : "white",
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
    backgroundColor : "white",
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
