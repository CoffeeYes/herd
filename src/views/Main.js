import React, {useState} from 'react';
import { View, ScrollView, Text, TouchableOpacity} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import Icon from 'react-native-vector-icons/MaterialIcons';

import Chats from './Chats';
import Contacts from './Contacts';
import Settings from './Settings';

const Tab = createBottomTabNavigator();

const Main = ({ navigation }) => {
    return(
      <Tab.Navigator screenOptions={({ route }) => ({
        headerShown : false,
        tabBarIcon : () => {
          if(route.name === "chats") {
            return <Icon name="chat" size={24}/>
          }
          else if (route.name === "contacts") {
            return <Icon name="contacts" size={24}/>
          }
          else if (route.name === "settings") {
            return <Icon name="settings" size={24}/>
          }
        }
      })}>
        <Tab.Screen name="chats" component={Chats} />
        <Tab.Screen name="contacts" component={Contacts} initialParams={{disableAddNew : false}}/>
        <Tab.Screen name="settings" component={Settings} />
      </Tab.Navigator>
    )
}

const styles = {
  navContainer : {
    backgroundColor : "white",
    flexDirection : "row",
    justifyContent : "space-between",
    width : "100%"
  },
  navItem : {
    padding : 20,
    flex : 1,
    alignItems : "center"
  },
  navItemActive : {
    padding : 20,
    flex : 1,
    alignItems : "center",
    backgroundColor : "#E86252"
  }
}

export default Main
