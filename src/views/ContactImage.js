import React, { useState, useEffect } from 'react';
import { Image, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';

const ContactImage = ({ contactName, size, imageWidth, imageHeight }) => {
  const [imageURI, setImageURI] = useState("");

  useEffect(() => {
    loadImage();
  },[])

  const loadImage = async () => {
    const contacts = JSON.parse(await AsyncStorage.getItem("contacts"));
    const contact = contacts.find(savedContact => savedContact.name === route.params.username);

    if(contact && contact?.image) {
      setImageURI(contact.image);
    }
  }

  return (
    <>
      {imageURI ?
      <Image
      source={{uri : imageURI}}
      style={{width : imageWidth, height : imageHeight}}/>
      :
      <Icon name="contact-page" size={24} style={styles.icon}/>
      }
    </>
  )
}

export default ContactImage;
