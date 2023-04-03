import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Text, TouchableOpacity, Image, View, ActivityIndicator, Dimensions, ScrollView, Alert} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from './Header';
import ListItem from './ListItem';
import { getAllContacts, deleteContacts as deleteContactsFromRealm } from '../realm/contactRealm';
import { getContactsWithChats } from '../realm/chatRealm';
import { parseRealmID } from '../realm/helper';
import { CommonActions } from '@react-navigation/native';

import { deleteContact } from '../redux/actions/contactActions';
import { deleteChat } from '../redux/actions/chatActions';


const Contacts = ({ route, navigation }) => {
  const dispatch = useDispatch();
  const customStyle = useSelector(state => state.chatReducer.styles);
  const chats = useSelector(state => state.chatReducer.chats);
  const contacts = route.params.type === "newChat" ?
  useSelector(state => state.contactReducer.contacts).filter(contact => chats.find(chat => chat._id === contact._id) === undefined)
  :
  useSelector(state => state.contactReducer.contacts);

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
            dispatch(deleteContact(contacts[index]));
            deleteContactsFromRealm([contacts[index]]);
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
          { name: 'chat', params: { contactID: id }}
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

      <ScrollView>
        {contacts?.map( (contact, index) =>
          <ListItem
          name={contact.name}
          key={contact._id}
          navigation={navigation}
          image={contact.image}
          textStyle={{fontWeight : "bold", fontSize : customStyle.uiFontSize}}
          containerStyle={index === (contacts?.length - 1) && ({borderBottomWidth : 0})}
          onPress={() => route.params.type === "newChat" ?
            navigateToNewChat(parseRealmID(contact))
            :
            navigation.navigate("contact", {id : parseRealmID(contact)})
          }
          deleteItem={() => onPressDelete(index)}
          />
        )}
      </ScrollView>
    </>
  )
}

export default Contacts;
