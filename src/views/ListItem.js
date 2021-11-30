import React, { useState } from 'react';
import { Text, View, TouchableOpacity, ActivityIndicator, Dimensions, Image } from 'react-native';
import ContactImage from './ContactImage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { imageValues } from '../assets/palette';

const ListItem = ({ name, image, deleteItem, onPress, containerStyle, textStyle,
                    imageContainerStyle, imageSize, rightText }) => {
  const [showDelete, setShowDelete ] = useState(false);

  return (
    <TouchableOpacity
    style={{...styles.listItem,paddingVertical : showDelete ? 0 : 10, paddingLeft : 10,...containerStyle}}
    onPress={onPress}
    onLongPress={() => setShowDelete(!showDelete)}>
      <View style={{...styles.imageContainer,...imageContainerStyle}}>
        <ContactImage
        imageURI={image}
        iconSize={24}
        imageWidth={Dimensions.get("window").width * imageValues.smallFactor}
        imageHeight={Dimensions.get("window").height * imageValues.smallFactor}/>
      </View>
      <Text style={{...styles.chatText,...textStyle}}>{name}</Text>

      {rightText &&
      <Text style={{marginLeft : "auto", marginRight : 10}}>{rightText}</Text>}

      {showDelete &&
      <TouchableOpacity
      style={styles.deleteButton}
      onPress={() => {
        setShowDelete(false);
        deleteItem(name);
      }}>
        <Icon name="delete" size={24} style={{color : "black"}}/>
      </TouchableOpacity>}

    </TouchableOpacity>
  )
}

const styles = {
  listItem : {
    flexDirection : "row",
    backgroundColor : "white",
    alignItems : "center",
    justifyContent : "flex-start",
    paddingVertical : 20
  },
  deleteButton : {
    backgroundColor : "#e05e3f",
    padding : 13,
    paddingVertical : 20,
  },
  imageContainer : {
    borderWidth : 1,
    borderColor : "grey",
    width : Dimensions.get("window").width * imageValues.smallFactor,
    height : Dimensions.get("window").width * imageValues.smallFactor,
    marginRight : 10,
    borderRadius : Dimensions.get("window").width * (imageValues.smallFactor/2),
    overflow : "hidden",
    alignSelf : "center",
    alignItems : "center",
    justifyContent : "center"
  },
  chatText : {
    fontSize : 16
  },
}

export default ListItem;
