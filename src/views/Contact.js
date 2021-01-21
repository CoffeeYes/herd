import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Share } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useClipboard } from '@react-native-community/clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage'

const Contact = ({route, navigation}) => {
  const [clipboardData, setClipboard] = useClipboard();
  const [showCopied, setShowCopied] = useState(false);

  const copyKeyToClipboard = async () => {
    const contacts = JSON.parse(await AsyncStorage.getItem("contacts"))
    const contact = contacts.find(savedContact => savedContact.name === route.params.username)

    if(contact) {
      setClipboard(contact.key)
      setShowCopied(true);
      setTimeout(() => setShowCopied(false),500)
    }
  }

  const shareContact = async () => {
    const contacts = JSON.parse(await AsyncStorage.getItem("contacts"));
    const contact = contacts.find(savedContact => savedContact.name === route.params.username);

    if(contact) {
      const key = contact.key
      const shared = await Share.share({
        title : "I'd like to share my Herd Contact with you!",
        message : key
      })
    }
  }

  return (
    <>
      <View style={styles.header}>
        <Text style={styles.headerText}>{route.params.username}</Text>
        <TouchableOpacity style={styles.editButton}>
          <Icon name="edit" size={24} style={{color : "white"}}/>
        </TouchableOpacity>
      </View>

      <ScrollView>
        <TextInput disabled="true" value={route.params.key} style={{alignSelf : "center"}}/>

        {showCopied && <Text
        style={{alignSelf : "center", fontWeight : "bold", fontSize : 18}}>
        Copied!
        </Text>}
        <TouchableOpacity
        style={styles.button}
        onPress={copyKeyToClipboard}>
          <Text style={styles.buttonText}>Copy Key</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={shareContact}>
          <Text style={styles.buttonText}>Share Contact</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("chat", {username : route.params.username})}>
          <Text style={styles.buttonText}>Go To Chat</Text>
        </TouchableOpacity>

      </ScrollView>
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
  editButton : {
    paddingHorizontal : 15,
    paddingVertical : 10,
    backgroundColor : "#EBB3A9"
  },
  button : {
    backgroundColor : "#E86252",
    padding : 10,
    alignSelf : "center",
    marginTop : 10,
    borderRadius : 5
  },
  buttonText : {
    color : "white",
    fontWeight : "bold"
  }
}

export default Contact;
