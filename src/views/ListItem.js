import React, { useState } from 'react';
import { Text, View, TouchableOpacity, ActivityIndicator, Dimensions, Image } from 'react-native';
import ContactImage from './ContactImage';
import Icon from 'react-native-vector-icons/MaterialIcons'

const ListItem = ({ name, image, deleteItem, navigation }) => {
  const [showDelete, setShowDelete ] = useState(false);

  return (
    <TouchableOpacity
    style={{...styles.listItem,paddingVertical : showDelete ? 0 : 10, paddingLeft : 10}}
    onPress={() => navigation.navigate("chat", {username : name})}
    onLongPress={() => setShowDelete(!showDelete)}>
      <View style={styles.imageContainer}>
        <ContactImage
        imageURI={image}
        iconSize={24}
        imageWidth={Dimensions.get("window").width * 0.1}
        imageHeight={Dimensions.get("window").height * 0.1}/>
      </View>
      <Text style={styles.chatText}>{name}</Text>

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
    flex : 1,
    backgroundColor : "white",
    alignItems : "center",
    justifyContent : "flex-start",
    borderBottomWidth : 0.2,
    borderBottomColor : "#e05e3f"
  },
  deleteButton : {
    backgroundColor : "#e05e3f",
    padding : 13,
    paddingVertical : 20,
    marginLeft : "auto"
  },
  imageContainer : {
    borderWidth : 1,
    borderColor : "grey",
    width : Dimensions.get("window").width * 0.1,
    height : Dimensions.get("window").width * 0.1,
    marginRight : 10,
    borderRadius : Dimensions.get("window").width * 0.05,
    overflow : "hidden",
    alignSelf : "center",
    alignItems : "center",
    justifyContent : "center"
  }
}

export default ListItem;
