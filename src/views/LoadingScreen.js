import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';

const LoadingScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Herd</Text>
      <ActivityIndicator size="large" color="#e05e3f"/>
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

export default LoadingScreen;
