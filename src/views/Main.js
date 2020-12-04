import React, {useState} from 'react';
import { View, ScrollView, Text, TouchableOpacity} from 'react-native';

import Icon from 'react-native-vector-icons/MaterialIcons';

import Chats from './Chats';
import Contacts from './Contacts';
import Settings from './Settings';

const Main = ({ navigation }) => {
    const [activePage, setActivePage] = useState("contacts");
    return(
      <>
        <ScrollView>
          {activePage === "contacts" &&
            <Contacts navigation={navigation}/>
          }
          {activePage === "chats" &&
            <Chats navigation={navigation}/>
          }
          {activePage === "settings" &&
            <Settings navigation={navigation}/>
          }
        </ScrollView>

        <View style={styles.navContainer}>
          <TouchableOpacity
          style={activePage === "chats" ? styles.navItemActive : styles.navItem}
          onPress={() => setActivePage("chats")}>
            <Icon name="chat" size={24}/>
          </TouchableOpacity>

          <TouchableOpacity
          style={activePage === "contacts" ? styles.navItemActive : styles.navItem}
          onPress={() => setActivePage("contacts")}>
            <Icon name="contacts" size={24}/>
          </TouchableOpacity>

          <TouchableOpacity
          style={activePage === "settings" ? styles.navItemActive : styles.navItem}
          onPress={() => setActivePage("settings")}>
            <Icon name="settings" size={24}/>
          </TouchableOpacity>
        </View>
      </>
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
