import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Share,
         Image, Dimensions , ActivityIndicator, Modal} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useClipboard } from '@react-native-community/clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from './Header';
import ContactImage from './ContactImage';
import Realm from 'realm';
import Schemas from '../Schemas';

import QRCodeModal from './QRCodeModal';
import FlashTextButton from './FlashTextButton';
import CustomButton from './CustomButton';
import { getContactById } from '../realm/contactRealm';

const Contact = ({route, navigation}) => {
  const [clipboardData, setClipboard] = useClipboard();
  const [showQRCode, setShowQRCode] = useState(false);
  const [contactID, setContactID] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactKey, setContactKey] = useState("");
  const [contactImage, setContactImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [showLargeImage, setShowLargeImage] = useState(false);


  useEffect(() => {
    loadContact().then(() => setLoading(false))
  },[])

  useEffect(() => {
    const focusListener = navigation.addListener('focus', () => {
      setLoading(true)
      loadContact().then(() => setLoading(false));
    });

    return focusListener;
  },[navigation])

  const loadContact = async () => {
    const contact = getContactById(route.params.id);
    if(contact) {
      setContactKey(contact.key);
      setContactName(contact.name);
      setContactID(contact._id[1])
      if(contact.image) {
        setContactImage(contact.image);
      }
    }
  }

  const copyKeyToClipboard = async () => {
    setClipboard(contactKey)
  }

  const shareContact = async () => {
    const shared = await Share.share({
      title : "I'd like to share my Herd Contact with you!",
      message : contactKey
    })
  }

  return (
    <>
      <Header
      title={contactName}
      allowGoBack
      rightButtonIcon="edit"
      rightButtonOnClick={() => navigation.navigate("editContact", {id : route.params.id})}/>

      {loading ?
      <ActivityIndicator size="large" color="#e05e3f"/>
      :
      <ScrollView contentContainerStyle={{paddingTop : 20}}>
        <View style={styles.imageContainer}>
          {contactImage !== "" ?
          <TouchableOpacity onPress={() => contactImage != "" && setShowLargeImage(true)}>
            <ContactImage
            imageURI={contactImage}
            iconSize={64}
            imageWidth={Dimensions.get("window").width * 0.4}
            imageHeight={Dimensions.get("window").height * 0.4}/>
          </TouchableOpacity>
          :
          <ContactImage
          imageURI={contactImage}
          iconSize={64}
          imageWidth={Dimensions.get("window").width * 0.4}
          imageHeight={Dimensions.get("window").height * 0.4}/>}
        </View>

        <FlashTextButton
        normalText="Copy Key"
        flashText="Copied!"
        timeout={500}
        buttonStyle={styles.buttonMargin}
        onPress={copyKeyToClipboard}/>

        <CustomButton
        onPress={shareContact}
        buttonStyle={styles.buttonMargin}
        text="Share Contact"/>
        <CustomButton
        onPress={() => navigation.navigate("chat", {contactID : route.params.id})}
        buttonStyle={styles.buttonMargin}
        text="Go To Chat"/>
        <CustomButton
        onPress={() => setShowQRCode(true)}
        buttonStyle={styles.buttonMargin}
        text="Show Contact's QR Code"/>

        <QRCodeModal
        visible={showQRCode}
        setVisible={setShowQRCode}
        value={{name : contactName, key : contactKey}}
        title={contactName}
        />

        <Modal
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLargeImage(false)}
        visible={showLargeImage}>
          <TouchableOpacity style={styles.modalMainContainer} onPress={() => setShowLargeImage(false)}>
            <View style={styles.modalContentContainer}>
            <Image
            source={{uri : contactImage}}
            style={{width : Dimensions.get("window").width * 0.8, height : Dimensions.get("window").height * 0.8}}/>
            </View>
          </TouchableOpacity>
        </Modal>
      </ScrollView>}
    </>
  )
}

const styles = {
  header : {
    flexDirection : "row",
    justifyContent : "space-between",
    alignItems : "center",
    backgroundColor : "#e05e3f",
    paddingLeft : 20
  },
  headerText : {
    fontSize : 18,
    color : "white"
  },
  editButton : {
    paddingHorizontal : 15,
    paddingVertical : 10,
    backgroundColor : "#EBB3A9"
  },
  buttonMargin : {
    marginTop : 10
  },
  imageContainer : {
    alignSelf : "center",
    width : Dimensions.get("window").width * 0.4,
    height : Dimensions.get("window").width * 0.4,
    borderRadius : Dimensions.get("window").width * 0.2,
    borderWidth : 1,
    borderColor : "grey",
    alignItems : "center",
    justifyContent : "center",
    overflow : "hidden",
    backgroundColor : "white"
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
    alignItems : "center",
    maxWidth : Dimensions.get('window').width * 0.8,
    maxHeight : Dimensions.get('window').height * 0.8
  }
}

export default Contact;
