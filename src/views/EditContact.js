import React, { useState, useEffect } from 'react';
import { View, TextInput } from 'react-native';

const EditContact = ({ route }) => {
  const [name, setName] = useState(route.params.username)

  return (
    <View>
      <TextInput
      style={{ height: 40, borderColor: 'gray', borderWidth: 1 }}
      onChangeText={text => onChangeText(text)}
      value={name}/>
    </View>
  )
}

export default EditContact;
