import React, { useState, useEffect } from 'react';
import { Image, Dimensions, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';

const ContactImage = ({ iconSize = 24, imageWidth = 20, imageHeight = 20, imageURI, disableTouch = false,
                        onPress, size = 24, containerStyle}) => {

  return (
    <TouchableOpacity
    disabled={disableTouch}
    onPress={onPress}
    style={{
      width : size,
      height : size,
      borderRadius : size / 2,
      ...containerStyle,
    }}>
      {imageURI?.length > 0 ?
      <Image
      source={{uri : imageURI}}
      style={{width : imageWidth, height : imageHeight}}/>
      :
      <Icon name="contact-page" size={iconSize}/>
      }
    </TouchableOpacity >
  )
}

export default ContactImage;
