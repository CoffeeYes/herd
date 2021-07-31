import React, { useState, useEffect } from 'react';
import { Text, TouchableOpacity, Image, View, ActivityIndicator, Dimensions, ScrollView, Alert} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from './Header';
import ListItem from './ListItem';
import Realm from 'realm';
import Schemas from '../Schemas';
import { getAllContacts, deleteContact } from '../realm/contactRealm'

const Contacts = ({ route, navigation }) => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    loadContacts();
  },[])

  useEffect(() => {
    const focusListener = navigation.addListener('focus', () => {
      loadContacts();
    });
    return focusListener;
  },[navigation])

  const loadContacts = async () => {
    setLoading(true);
    setContacts(getAllContacts());
    setLoading(false);
  }

  const onPressDelete = async index => {
    Alert.alert(
      'Are you sure ?',
      '',
      [
        { text: "Cancel", style: 'cancel', onPress: () => {} },
        {
          text: 'Delete',
          style: 'destructive',
          // If the user confirmed, then we dispatch the action we blocked earlier
          // This will continue the action that had triggered the removal of the screen
          onPress: () => {
            deleteContact(contacts[index]);
            setContacts(getAllContacts());
          },
        },
      ]
    );
  }

  return (
    <>
      <Header
      title="Contacts"
      {...(!route.params.disableAddNew && {rightButtonIcon : "add"})}
      rightButtonOnClick={() => navigation.navigate("addContact")}
      allowGoBack={route.params.disableAddNew}/>

      {loading ?
      <ActivityIndicator size="large" color="#e05e3f"/>
      :
      <ScrollView>
        {contacts?.map( (contact, index) =>
          <ListItem
          name={contact.name}
          key={index}
          navigation={navigation}
          image={contact.image}
          onPress={() => route.params.type === "newChat" ?
            navigation.navigate("chat", {contactID : contact.id})
            :
            navigation.navigate("contact", {id : contact._id[1]})
          }
          deleteItem={() => onPressDelete(index)}
          />
        )}
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
    paddingLeft : 20,
  },
  headerText : {
    fontSize : 18,
    color : "white"
  },
  contact : {
    backgroundColor : "white",
    flexDirection : "row",
    borderBottomColor : "#e05e3f",
    borderBottomWidth : 0.2
  },
  contactText : {
    padding : 20,
    paddingLeft : 10
  },
  image : {
    borderRadius : 50,
    overflow : "hidden",
    alignSelf : "center"
  },
  imageContainer : {
    borderWidth : 1,
    borderColor : "grey",
    width : Dimensions.get("window").width * 0.1,
    height : Dimensions.get("window").width * 0.1,
    marginLeft : 10,
    borderRadius : Dimensions.get("window").width * 0.05,
    overflow : "hidden",
    alignSelf : "center",
    alignItems : "center",
    justifyContent : "center"
  },
  deleteButton : {
    backgroundColor : "#e05e3f",
    marginLeft : "auto",
    padding : 13
  }
}

export default Contacts;
