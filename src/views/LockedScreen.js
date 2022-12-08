import React from 'react';
import { View, Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const LockedScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Herd</Text>
      <Icon name="lock" size={72}/>
    </View>
  )
}

const styles = {
  container : {
    flex : 1,
    alignItems : "center",
    justifyContent : "center"
  },
  text : {
    fontSize : 48
  }
}

export default LockedScreen;
