import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Share,
         Image, Dimensions , ActivityIndicator, Modal} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useClipboard } from '@react-native-community/clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from './Header';
import ContactImage from './ContactImage';

import QRCodeModal from './QRCodeModal';
import CardButton from './CardButton';
import FlashTextButton from './FlashTextButton';
import CustomModal from './CustomModal';
import { getContactById } from '../realm/contactRealm';

import { largeImageContainerStyle } from '../assets/styles';

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
        <View style={largeImageContainerStyle}>
          {contactImage !== "" ?
          <TouchableOpacity
          onPress={() => contactImage != "" && setShowLargeImage(true)}>
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

        <View style={{alignItems : "center"}}>
          <CardButton
          text="Copy Key"
          flashText="Copied!"
          timeout={500}
          rightIcon="content-copy"
          onPress={copyKeyToClipboard}/>

          <CardButton
          onPress={shareContact}
          rightIcon="share"
          text="Share Contact"/>

          <CardButton
          onPress={() => navigation.navigate("chat", {contactID : route.params.id})}
          rightIcon="chat"
          text="Go To Chat"/>

          <CardButton
          onPress={() => setShowQRCode(true)}
          rightIcon="qr-code"
          text="Show Contact's QR Code"/>

        </View>

        <QRCodeModal
        visible={showQRCode}
        setVisible={setShowQRCode}
        value={{name : contactName, key : contactKey}}
        title={contactName}
        />

        <CustomModal visible={showLargeImage} setVisible={setShowLargeImage}>
            <Image
            source={{uri : contactImage}}
            style={styles.largeImage}/>
        </CustomModal>

      </ScrollView>}
    </>
  )
}

const styles = {
  largeImage : {
    width : Dimensions.get("window").width * 0.8,
    height : Dimensions.get("window").height * 0.8
  }
}

export default Contact;
