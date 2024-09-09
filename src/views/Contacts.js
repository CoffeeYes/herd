import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ScrollView, Alert} from 'react-native';
import Header from './Header';
import ListItem from './ListItem';
import { deleteContacts as deleteContactsFromRealm } from '../realm/contactRealm';
import { parseRealmID } from '../realm/helper';
import { CommonActions } from '@react-navigation/native';

import { deleteContacts } from '../redux/actions/contactActions';


const Contacts = ({ route, navigation }) => {
  const dispatch = useDispatch();
  const customStyle = useSelector(state => state.chatReducer.styles);
  const chats = useSelector(state => state.chatReducer.chats);
  const contacts = route.params.type === "newChat" ?
  useSelector(state => state.contactReducer.contacts)
  .filter(contact => chats.find(chat => chat._id === contact._id) === undefined)
  :
  useSelector(state => state.contactReducer.contacts);
  const [highlightedContacts, setHighlightedContacts ] = useState([]);

  const onPressDelete = () => {
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

  const handleLongPress = contactID => {
    if(route.params.type === "newChat") {
      navigateToNewChat(parseRealmID(contactID))
    }
    else if(!highlightedContacts.includes(contactID)) {
      setHighlightedContacts([...highlightedContacts,contactID]);
    }
  }

  const handlePress = contactID => {
    if(route.params.type === "newChat") {
      navigateToNewChat(parseRealmID(contactID))
    }
    else {
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
          image={contact.image}
          textStyle={{fontWeight : "bold", fontSize : customStyle.scaledUIFontSize}}
          containerStyle={index === (contacts?.length - 1) && ({borderBottomWidth : 0})}
          onPress={() => handlePress(contact._id)}
          onLongPress={() => handleLongPress(contact._id)}
          highlighted={highlightedContacts.includes(contact._id)}
          highlightedStyle={{backgroundColor : "rgba(0,0,0,0.1)"}}
          />
        )}
      </ScrollView>
    </>
  )
}

export default Contacts;
