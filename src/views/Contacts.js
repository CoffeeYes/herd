import React, { useState, useEffect } from 'react';
import { Text, TouchableOpacity, Image, View, ActivityIndicator} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';

const ContactItem = ({ navigation, contact, setContacts, type }) => {
  const [showDelete, setShowDelete] = useState(false);

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
      <TouchableOpacity
      style={styles.contact}
      onPress={() => type === "contacts" ?
        navigation.navigate("contact", {username : contact.name, key : contact.key})
        :
        navigation.navigate("chat",{username : contact.name})}
      onLongPress={() => setShowDelete(!showDelete)}>
        <Image
        source={contact.image}
        style={styles.image}/>

        <Text style={styles.contactText}>{contact.name}</Text>
        {showDelete &&
        <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => {
          setShowDelete(false);
          deleteContact(contact.name);
        }}>
          <Icon name="delete" size={24} style={{color : "black"}}/>
        </TouchableOpacity>}
      </TouchableOpacity>
  )
}

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

  return (
    <>
      <View style={{...styles.header,paddingVertical : route.params.disableAddNew ? 15 : 0}}>
        <Text style={styles.headerText}>Contacts</Text>
        {!route.params.disableAddNew && <TouchableOpacity
        onPress={() => navigation.navigate("addContact")}
        style={{backgroundColor : "#EBB3A9",paddingVertical : 15,paddingHorizontal : 20}}>
          <Text style={styles.headerText}>+</Text>
        </TouchableOpacity>}
      </View>
      {loading && <ActivityIndicator size="large" color="#e05e3f"/>}
      {contacts?.map( (contact, index) =>
        <ContactItem
        key={index}
        contact={contact}
        navigation={navigation}
        setContacts={setContacts}
        type={route.params.type}/>
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
    padding : 20
  },
  image : {
    borderRadius : 50,
    overflow : "hidden",
  },
  deleteButton : {
    backgroundColor : "#e05e3f",
    marginLeft : "auto",
    padding : 13
  }
}

export default Contacts;
