import React, { useState } from 'react';
import { Text, View, TouchableOpacity, Dimensions, Image } from 'react-native';
import ContactImage from './ContactImage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { imageValues, palette } from '../assets/palette';

const ListItem = ({ name, image, deleteItem, onPress, containerStyle, textStyle,
                    imageContainerStyle, imageSize, rightText, subText, subTextStyle,
                    rightTextStyle, rightIcon, rightIconSize, rightIconStyle }) => {
  const [showDelete, setShowDelete ] = useState(false);
  const [deleteButtonHeight,setDeleteButtonHeight] = useState(10);

  return (
    <TouchableOpacity
    style={{...styles.listItem,paddingVertical : showDelete ? 0 : 10, paddingLeft : 10,...containerStyle}}
    onPress={onPress}
    onLayout={event => {setDeleteButtonHeight(event.nativeEvent.layout.height)}}
    onLongPress={() => setShowDelete(!showDelete)}>
      <View style={{...styles.imageContainer,...imageContainerStyle}}>
        <ContactImage
        imageURI={image}
        iconSize={24}
        imageWidth={Dimensions.get("window").width * imageValues.smallFactor}
        imageHeight={Dimensions.get("window").height * imageValues.smallFactor}/>
      </View>
      <View style={{flex : 1}}>
        <Text style={{...styles.chatText,...textStyle}}>{name}</Text>

        {subText &&
        <View style={styles.subTextContainer}>
          <Text
          numberOfLines={1}
          style={{...styles.subText,...subTextStyle}}>{subText}</Text>
        </View>}
      </View>

      {rightText &&
      <Text style={{...styles.rightTextStyle,...rightTextStyle}}>{rightText}</Text>}

      {rightIcon &&
      <Icon name={rightIcon} size={rightIconSize || 24} style={rightIconStyle}/>}

      {showDelete &&
      <TouchableOpacity
      style={{...styles.deleteButton,marginLeft : rightText ? 0 : "auto", height : deleteButtonHeight}}
      onPress={() => {
        setShowDelete(false);
        deleteItem(name);
      }}>
        <Icon name="delete" size={24} style={{color : palette.black}}/>
      </TouchableOpacity>}

    </TouchableOpacity>
  )
}

const styles = {
  listItem : {
    flexDirection : "row",
    backgroundColor : palette.white,
    alignItems : "center",
    justifyContent : "flex-start",
    paddingVertical : 20
  },
  deleteButton : {
    // backgroundColor : "#e05e3f",
    backgroundColor : "#e05e3f",
    alignItems : "center",
    justifyContent : "center",
    width : Dimensions.get("window").width * 0.20,
    maxWidth :150
  },
  imageContainer : {
    borderWidth : 1,
    borderColor : palette.grey,
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
    fontSize : 16,
  },
  subTextContainer : {

  },
  subText : {
    color : "grey"
  },
  rightTextStyle : {
    marginLeft : "auto",
    marginRight : 10
  }
}

export default ListItem;
