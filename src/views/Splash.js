import React from 'react';
import { Text, Button } from 'react-native';

const Splash = ({ navigation }) => {
  return (
    <>
    <Text>Splash</Text>
    <Button title="contacts" onPress={() => navigation.navigate('contacts')}/>
    </>
  )
}

export default Splash;
