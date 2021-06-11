import React, { useState, useEffect } from 'react';
import { Text, TouchableOpacity, Image, View, ActivityIndicator, Dimensions} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from './Header';
import ListItem from './ListItem'

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
    const storedContacts = JSON.parse(await AsyncStorage.getItem("contacts"));
    await setContacts(storedContacts)
    setLoading(false);
  }

  const deleteContact = async name => {
    var contacts = JSON.parse(await AsyncStorage.getItem("contacts"));
    for(var i = 0; i < contacts.length; i++) {
      if(contacts[i].name === name) {
        contacts.splice(i,1);
      }
    }
    await AsyncStorage.setItem("contacts",JSON.stringify(contacts));
    setContacts(contacts)
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
      contacts?.map( (contact, index) =>
        <ListItem
        name={contact.name}
        key={index}
        navigation={navigation}
        image={contact.image}
        onPress={() => route.params.type === "newChat" ?
          navigation.navigate("chat", {username : contact.name})
          :
          navigation.navigate("contact", {username : contact.name, key : contact.key})
        }
        deleteItem={name => deleteContact(name)}
        />
      )}
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
