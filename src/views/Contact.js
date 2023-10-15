import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Share,
         Image, Dimensions , ActivityIndicator, Modal} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useClipboard } from '@react-native-community/clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from './Header';
import ContactImage from './ContactImage';

import QRCodeModal from './QRCodeModal';
import CardButton from './CardButton';
import CustomModal from './CustomModal';
import { getContactById } from '../realm/contactRealm';

import { largeImageContainerStyle } from '../assets/styles';
import { useScreenAdjustedSize } from '../helper';

const Contact = ({route, navigation}) => {
  const [clipboardData, setClipboard] = useClipboard();
  const [showQRCode, setShowQRCode] = useState(false);
  const [showLargeImage, setShowLargeImage] = useState(false);
  const contact = useSelector(state => state.contactReducer.contacts.find(contact => contact._id == route.params.id));

  const cardButtonWidth = useScreenAdjustedSize( 0.9, 0.9);
  const cardButtonTextWidth = useScreenAdjustedSize( 0.4, 0.4);
  const contactImageSize = useScreenAdjustedSize(0.4,0.25);

  const largeImageWidth = useScreenAdjustedSize(0.8,0.8);
  const largeImageHeight = useScreenAdjustedSize(0.8,0.8,"height");
  const [expandName, setExpandName] = useState(true);
  const [disableTextTouch, setDisableTextTouch] = useState(false);

  const copyKeyToClipboard = () => {
    setClipboard(contact.key)
    return true;
  }

  const shareContact = async () => {
    const shared = await Share.share({
      title : "I'd like to share my Herd Contact with you!",
      message : contact.key
    })
  }

  return (
    <>
      <Header
      title={contact.name}
      containerStyle={expandName && ({flexShrink : 1})}
      allowGoBack
      onTextLayout={e => e.nativeEvent.lines.length <= 1 && setDisableTextTouch(true)}
      disableTextTouch={disableTextTouch}
      limitTitleLines={expandName}
      rightButtonIcon="edit"
      onTextTouch={() => setExpandName(!expandName)}
      rightButtonOnClick={() => navigation.navigate("editContact", {id : route.params.id})}/>

      <ScrollView contentContainerStyle={{paddingVertical : 20}}>

        <ContactImage
        containerStyle={largeImageContainerStyle}
        disableTouch={contact?.image?.trim()?.length === 0}
        imageURI={contact.image}
        iconSize={64}
        onPress={() => setShowLargeImage(true)}
        size={contactImageSize}/>

        <View style={{alignItems : "center"}}>
          <CardButton
          containerStyle={{width : cardButtonWidth}}
          textContainerStyle={{width : cardButtonTextWidth}}
          text="Copy Key"
          flashText="Copied!"
          timeout={500}
          rightIcon="content-copy"
          onPress={copyKeyToClipboard}/>

          <CardButton
          containerStyle={{width : cardButtonWidth}}
          textContainerStyle={{width : cardButtonTextWidth}}
          onPress={() => setShowQRCode(true)}
          rightIcon="qr-code"
          text="Show Contact's QR Code"/>

          <CardButton
          containerStyle={{width : cardButtonWidth}}
          textContainerStyle={{width : cardButtonTextWidth}}
          onPress={shareContact}
          rightIcon="share"
          text="Share Contact"/>

          <CardButton
          containerStyle={{width : cardButtonWidth}}
          textContainerStyle={{width : cardButtonTextWidth}}
          onPress={() => navigation.navigate("chat", {contactID : route.params.id})}
          rightIcon="chat"
          text="Go To Chat"/>

        </View>
      </ScrollView>

      <QRCodeModal
      visible={showQRCode}
      onPress={() => setShowQRCode(false)}
      onRequestClose={() => setShowQRCode(false)}
      value={{name : contact.name, key : contact.key}}
      title={contact.name}
      />

      <CustomModal
      visible={showLargeImage}
      onPress={() => setShowLargeImage(false)}
      onRequestClose={() => setShowLargeImage(false)}>
        <Image
        source={{uri : contact.image}}
        style={{height : largeImageHeight, width : largeImageWidth}}/>
      </CustomModal>
    </>
  )
}

export default Contact;
