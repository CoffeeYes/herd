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

import { deleteContacts } from '../redux/actions/contactActions';
import { deleteChat } from '../redux/actions/chatActions';


const Contacts = ({ route, navigation }) => {
  const dispatch = useDispatch();
  const customStyle = useSelector(state => state.chatReducer.styles);
  const chats = useSelector(state => state.chatReducer.chats);
  const contacts = route.params.type === "newChat" ?
  useSelector(state => state.contactReducer.contacts).filter(contact => chats.find(chat => chat._id === contact._id) === undefined)
  :
  useSelector(state => state.contactReducer.contacts);
  const [highlightedContacts, setHighlightedContacts ] = useState([]);

  const onPressDelete = async index => {
    Alert.alert(
      'Are you sure ?',
      '',
      [
        { text: "Cancel", style: 'cancel', onPress: () => setHighlightedContacts([]) },
        {
          text: 'Delete',
          style: 'destructive',
          // If the user confirmed, then we dispatch the action we blocked earlier
          // This will continue the action that had triggered the removal of the screen
          onPress: () => {
            dispatch(deleteContacts(highlightedContacts));
            deleteContactsFromRealm(highlightedContacts);
            setHighlightedContacts([]);
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

  const handleLongPress = contact => {
    if(highlightedContacts.indexOf(contact) == -1) {
      setHighlightedContacts([...highlightedContacts,contact]);
    }
  }

  const handlePress = contact => {
    if(highlightedContacts.length > 0) {
      const contactIndex = highlightedContacts.indexOf(contact);
      if(contactIndex === -1) {
        setHighlightedContacts([...highlightedContacts,contact]);
      }
      else {
        setHighlightedContacts([...highlightedContacts].filter(highlightedContact => highlightedContact !== contact));
      }
    }
    else {
      route.params.type === "newChat" ?
      navigateToNewChat(parseRealmID(contact))
      :
      navigation.navigate("contact", {id : parseRealmID(contact)})
    }
  }

  return (
    <>
      <Header
      title={route.params.type === "newChat" ? "Start a new Chat" : "Contacts"}
      {...(!route.params.disableAddNew && {rightButtonIcon : highlightedContacts.length > 0 ? "delete" : "add"})}
      rightButtonOnClick={() => highlightedContacts.length > 0 ? onPressDelete() : navigation.navigate("addContact")}
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
          onPress={() => handlePress(contact)}
          onLongPress={() => handleLongPress(contact)}
          highlighted={highlightedContacts.indexOf(contact) !== -1}
          highlightedStyle={{backgroundColor : "rgba(0,0,0,0.1)"}}
          />
        )}
      </ScrollView>
    </>
  )
}

export default Contacts;
