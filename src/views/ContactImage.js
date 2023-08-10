import React, { useState, useEffect } from 'react';
import { Image, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';

const ContactImage = ({ iconSize = 24, imageWidth = 20, imageHeight = 20, imageURI }) => {

  return (
    <>
      {imageURI?.length > 0 ?
      <Image
      source={{uri : imageURI}}
      style={{width : imageWidth, height : imageHeight}}/>
      :
      <Icon name="contact-page" size={iconSize}/>
      }
    </>
  )
}

export default ContactImage;
