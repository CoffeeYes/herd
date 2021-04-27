import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Share, Image, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useClipboard } from '@react-native-community/clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from './Header'

import QRCodeModal from './QRCodeModal'

const Contact = ({route, navigation}) => {
  const [clipboardData, setClipboard] = useClipboard();
  const [showCopied, setShowCopied] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [contactKey, setContactKey] = useState("");
  const [contactImage, setContactImage] = useState("");

  useEffect(() => {
    loadKey();
  },[])

  const loadKey = async () => {
    const contacts = JSON.parse(await AsyncStorage.getItem("contacts"));
    const contact = contacts.find(savedContact => savedContact.name === route.params.username);

    if(contact) {
      setContactKey(contact.key);
      if(contact.image) {
        setContactImage(contact.image);
      }
    }
  }

  const copyKeyToClipboard = async () => {
    const contacts = JSON.parse(await AsyncStorage.getItem("contacts"))
    const contact = contacts.find(savedContact => savedContact.name === route.params.username)

    if(contact) {
      setClipboard(contact.key)
      setShowCopied(true);
      setTimeout(() => setShowCopied(false),500)
    }
  }

  const shareContact = async () => {
    const contacts = JSON.parse(await AsyncStorage.getItem("contacts"));
    const contact = contacts.find(savedContact => savedContact.name === route.params.username);

    if(contact) {
      const key = contact.key
      const shared = await Share.share({
        title : "I'd like to share my Herd Contact with you!",
        message : key
      })
    }
  }



  return (
    <>
      <Header
      title={route.params.username}
      allowGoBack
      rightButtonIcon="edit"
      rightButtonOnClick={() => navigation.navigate("editContact", {username : route.params.username})}/>

      <ScrollView>
        <View style={styles.imageContainer}>
          {contactImage ?
          <Image
          source={contactImage}
          style={styles.image}/>
          :
          <Icon name="contact-page" size={64} style={styles.image}/>
          }
        </View>

        {showCopied && <Text
        style={{alignSelf : "center", fontWeight : "bold", fontSize : 18}}>
        Copied!
        </Text>}
        <TouchableOpacity
        style={styles.button}
        onPress={copyKeyToClipboard}>
          <Text style={styles.buttonText}>Copy Key</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={shareContact}>
          <Text style={styles.buttonText}>Share Contact</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("chat", {username : route.params.username})}>
          <Text style={styles.buttonText}>Go To Chat</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => setShowQRCode(true)}>
          <Text style={styles.buttonText}>Show Contact's QR Code</Text>
        </TouchableOpacity>

        <QRCodeModal
        visible={showQRCode}
        setVisible={setShowQRCode}
        text={contactKey}
        />

      </ScrollView>
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
    fontFamily : "Open-Sans"
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
  }
}

export default Contact;
