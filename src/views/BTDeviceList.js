import React, { useState } from 'react';
import { Text, View, ScrollView, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';

const BTDeviceList = () => {
  const [deviceList, setDeviceList] = useState([1,2,3,4]);
  return (
    <View style={styles.mainContainer}>
      <Text>Scanning...</Text>
      <ActivityIndicator size="large" color="#e05e3f"/>
      <ScrollView contentContainerStyle={styles.BTList}>
        {deviceList.map((device,index) =>
          <TouchableOpacity key={index} style={styles.deviceContainer}>
            <Text>Device</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  )
}

const styles = {
  mainContainer : {
    alignItems : "center",
    padding : 20
  },
  BTList : {
    backgroundColor : "#D8D8D8",
    width : Dimensions.get("window").width,
    padding : 10,
  },
  deviceContainer : {
    padding : 10,
    backgroundColor : "white",
    marginTop : 2,
    borderBottomColor : "black"
  }
}

export default BTDeviceList;
