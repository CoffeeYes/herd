import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { palette } from '../assets/palette';

import Icon from 'react-native-vector-icons/MaterialIcons';

import Chats from './Chats';
import Contacts from './Contacts';
import Settings from './Settings';
import { useScreenAdjustedSize } from '../helper';

const Tab = createBottomTabNavigator();

const Main = ({ route }) => {

    const iconSize = useScreenAdjustedSize(0.07,0.04);
    const tabBarHeight = useScreenAdjustedSize(0.075,0.15,"height",1,0.7,undefined,1000);

    return(
      <Tab.Navigator
      backBehavior='history'
      initialRouteName={route?.params?.initialRoute || "chats"}
      screenOptions={({ route }) => ({
        headerShown : false,
        tabBarShowLabel : false,
        tabBarInactiveTintColor: palette.black,
        tabBarActiveTintColor: palette.primary,
        tabBarStyle : {height : tabBarHeight},
        tabBarIconStyle : {width : iconSize},
        tabBarIcon : ({ color }) => {
          return <Icon name={route.name === "chats" ? "chat" : route.name} size={iconSize} color={color}/>
        }
      })}>
        <Tab.Screen name="chats" component={Chats} />
        <Tab.Screen name="contacts" component={Contacts} initialParams={{disableAddNew : false}}/>
        <Tab.Screen name="settings" component={Settings} />
      </Tab.Navigator>
    )
}

export default Main
