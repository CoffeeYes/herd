import React from 'react';
import { View, Text, Modal, TouchableOpacity, Dimensions } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

const QRCodeModal = ({ visible, text, setVisible }) => {
  return (
    <Modal
    animationType="slide"
    transparent={true}
    onRequestClose={() => setVisible(false)}
    visible={visible}>
      <View style={styles.modalMainContainer}>
        <View style={styles.modalContentContainer}>
          <View style={styles.QRContainer}>
            <QRCode
            value={text}
            size={300}/>
          </View>
          <TouchableOpacity
          style={styles.button}
          onPress={() => setVisible(false)}>
          <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
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
  }
}

export default QRCodeModal
