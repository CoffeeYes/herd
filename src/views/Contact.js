import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Crypto from '../nativeWrapper/Crypto';

const Contact = ({route, navigation}) => {
  const [ userKey, setUserKey ] = useState("");

  useEffect(() => {
    Crypto.loadKeyFromKeystore(route.params.username).then(publicKey => {
      publicKey && setUserKey(publicKey)
    })
  },[])
  return (
    <>
      <View style={styles.header}>
        <Text style={styles.headerText}>{route.params.username}</Text>
        <TouchableOpacity style={styles.editButton}>
          <Icon name="edit" size={24} style={{color : "white"}}/>
        </TouchableOpacity>
      </View>

      <ScrollView>
        <TextInput disabled="true" value={userKey} style={{alignSelf : "center"}}/>

        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Copy Key</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Share Contact</Text>
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
