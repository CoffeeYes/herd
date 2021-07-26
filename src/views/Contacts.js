import React, { useState, useEffect } from 'react';
import { Text, TouchableOpacity, Image, View, ActivityIndicator, Dimensions, ScrollView, Alert} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from './Header';
import ListItem from './ListItem';
import Realm from 'realm';
import Schemas from '../Schemas';
import { cloneDeep } from 'lodash';

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

    try {
      const contactsRealm = await Realm.open({
        path : 'contacts',
        schema : [Schemas.ContactSchema]
      });
      const contacts = contactsRealm.objects('Contact');

      //create a deepclone of the realm data so that we can perform operations on it directly in state
      var contactsDeepClone = [];
      for(var item in contacts) {
        contactsDeepClone.push(cloneDeep(contacts[item]));
      }
      setContacts(contactsDeepClone);
    }
    catch(error) {
      console.log("Error opening contacts realm : " + error)
    }
    setLoading(false);
  }

  const deleteContact = async index => {
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
          onPress: async () => {
            const contactsRealm = await Realm.open({
              path : 'contacts',
              schema : [Schemas.ContactSchema]
            })
            contactsRealm.write(async () => {
              await contactsRealm.delete(contacts[index]);
              setContacts([...contacts].splice(index,1));
            })
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
            navigation.navigate("contact", {id : Realm.BSON.ObjectId(contact._id[1])})
          }
          deleteItem={() => deleteContact(index)}
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
