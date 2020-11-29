import React, { useState } from 'react';
import { Text, TouchableOpacity, Image, View} from 'react-native';

const Contact = ({ navigation }) => {
  const [contacts, setContacts] = useState([{name : "Test"}]);

  const handlePressContact = () => {
    navigation.navigate("chat")
  }
  
  return (
    <>
      <View style={styles.header}>
        <Text style={styles.headerText}>Contacts</Text>
        <TouchableOpacity
        onPress={() => navigation.navigate("addContact")}
        style={{backgroundColor : "#EBB3A9",paddingVertical : 10,paddingHorizontal : 20}}>
          <Text style={styles.headerText}>+</Text>
        </TouchableOpacity>
      </View>
      {contacts.map( (contact, index) =>
        <TouchableOpacity
        key={index}
        style={styles.contact}
        onPress={handlePressContact}>
          <Image
          source={contact.image}
          style={styles.image}/>

          <Text>{contact.name}</Text>
        </TouchableOpacity>
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
    paddingLeft : 20
  },
  headerText : {
    fontSize : 18,
    color : "white"
  },
  contact : {
    backgroundColor : "white",
    padding : 20,
    flexDirection : "row"
  },
  image : {
    borderRadius : 50,
    overflow : "hidden",
  }
}

export default Contact;
