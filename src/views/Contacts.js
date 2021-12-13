import React, { useState, useEffect } from 'react';
import { Text, TouchableOpacity, Image, View, ActivityIndicator, Dimensions, ScrollView, Alert} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from './Header';
import ListItem from './ListItem';
import Realm from 'realm';
import Schemas from '../Schemas';
import { getAllContacts, deleteContact } from '../realm/contactRealm';
import { parseRealmID } from '../realm/helper';
import { CommonActions } from '@react-navigation/native';


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
            loadContacts();
          },
        },
      ]
    );
  }

  const navigateToNewChat = id => {
    navigation.dispatch(
      CommonActions.reset({
        index: 1,
        routes: [
          { name: 'main' },
          { name: 'chat', params: { contactID: id },}
        ],
      })
    );
  }

  return (
    <>
      <Header
      title={route.params.type === "newChat" ? "Start a new Chat" : "Contacts"}
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
            navigateToNewChat(parseRealmID(contact))
            :
            navigation.navigate("contact", {id : parseRealmID(contact)})
          }
          deleteItem={() => onPressDelete(index)}
          />
        )}
      </ScrollView>}
    </>
  )
}

const styles = {

}

export default Contacts;
