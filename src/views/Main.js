import React, {useState, useEffect} from 'react';
import { View, ScrollView, Text, TouchableOpacity} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { palette } from '../assets/palette';

import Icon from 'react-native-vector-icons/MaterialIcons';

import Chats from './Chats';
import Contacts from './Contacts';
import Settings from './Settings';

const Tab = createBottomTabNavigator();

const Main = ({ navigation, route }) => {

    return(
      <Tab.Navigator
      initialRouteName={route?.params?.initialRoute || "chats"}
      screenOptions={({ route }) => ({
        headerShown : false,
        tabBarShowLabel : false,
        tabBarInactiveTintColor: palette.black,
        tabBarActiveTintColor: palette.primary,
        tabBarIcon : ({ color, size }) => {
          if(route.name === "chats") {
            return <Icon name="chat" size={size} color={color}/>
          }
          else if (route.name === "contacts") {
            return <Icon name="contacts" size={size} color={color}/>
          }
          else if (route.name === "settings") {
            return <Icon name="settings" size={size} color={color}/>
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
    backgroundColor : palette.white,
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
    backgroundColor : palette.primary
  }
}

export default Main
