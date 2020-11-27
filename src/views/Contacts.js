import React, { useState } from 'react';
import { Text, TouchableOpacity, Image } from 'react-native';

const Contact = ({ navigation }) => {
  const [contacts, setContacts] = useState([{name : "Test"}]);

  const handlePressContact = () => {
    navigation.navigate("chat")
  }
  return (
    <>
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
