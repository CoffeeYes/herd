import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ScrollView } from 'react-native';
import { deleteContacts as deleteContactsFromRealm } from '../realm/contactRealm';
import { CommonActions } from '@react-navigation/native';

import Header from './Header';
import ListItem from './ListItem';
import ConfirmationModal from './ConfirmationModal';

import { deleteContacts } from '../redux/actions/contactActions';

const Contacts = ({ route, navigation }) => {
  const dispatch = useDispatch();
  const customStyle = useSelector(state => state.appStateReducer.styles);
  const chats = useSelector(state => state.chatReducer.chats);
  const contacts = route.params.type === "newChat" ?
  useSelector(state => state.contactReducer.contacts)
  .filter(contact => chats.find(chat => chat._id === contact._id) === undefined)
  :
  useSelector(state => state.contactReducer.contacts);
  const [highlightedContacts, setHighlightedContacts ] = useState([]);

  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  const navigateToNewChat = id => {
    //remove "newChat" from route history and navigate to new chat
    const routes = navigation.getState().routes;
    const newRoutes = [...routes].splice(0,routes.length -1);
    navigation.dispatch(
      CommonActions.reset({
        index: newRoutes.length,
        routes: [
          ...newRoutes,
          { name: 'chat', params: { contactID: id }}
        ],
      })
    );
  }

  const handleLongPress = contactID => {
    if(!highlightedContacts.includes(contactID)) {
      setHighlightedContacts([...highlightedContacts,contactID]);
    }
  }

  const handlePress = contactID => {
    if(highlightedContacts.length > 0) {
      if(!highlightedContacts.includes(contactID)) {
        setHighlightedContacts([...highlightedContacts,contactID]);
      }
      else {
        setHighlightedContacts(highlightedContacts.filter(highlightedContact => highlightedContact !== contactID));
      }
    }
    else {
      navigation.navigate("contact", {id : contactID})
    }
  }

  return (
    <>
      <Header
      title={route.params.type === "newChat" ? "Start a new Chat" : "Contacts"}
      {...(!route.params.disableAddNew && {rightButtonIcon : highlightedContacts.length > 0 ? "delete" : "add"})}
      rightButtonOnClick={() => highlightedContacts.length > 0 ? setShowConfirmationModal(true) : navigation.navigate("addContact")}
      allowGoBack={route.params.disableAddNew}/>

      <ScrollView>
        {contacts?.map( (contact, index) =>
          <ListItem
          name={contact.name}
          key={contact._id}
          image={contact.image}
          textStyle={{fontWeight : "bold", fontSize : customStyle.scaledUIFontSize}}
          containerStyle={index === (contacts?.length - 1) && ({borderBottomWidth : 0})}
          onPress={() => route.params.type == "newChat" ? navigateToNewChat(contact._id) : handlePress(contact._id)}
          onLongPress={() => route.params.type == "newChat" ? navigateToNewChat(contact._id) : handleLongPress(contact._id)}
          highlighted={highlightedContacts.includes(contact._id)}
          highlightedStyle={{backgroundColor : "rgba(0,0,0,0.1)"}}
          />
        )}
      </ScrollView>

      <ConfirmationModal
      visible={showConfirmationModal}
      onConfirm={() => {
        dispatch(deleteContacts(highlightedContacts));
        deleteContactsFromRealm(contacts.filter(contact => highlightedContacts.includes(contact._id)));
        setHighlightedContacts([]);
        setShowConfirmationModal(false);
      }}
      onCancel={() => setShowConfirmationModal(false)}
      titleText="Are you sure you want to delete these contacts?"
      />
    </>
  )
}

export default Contacts;
