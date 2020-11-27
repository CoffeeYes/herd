import React, {useState} from 'react';
import { View, ScrollView, Text, TouchableOpacity} from 'react-native';

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
          style={styles.navItem}
          onPress={() => setActivePage("chats")}>
            <Text>Chats</Text>
          </TouchableOpacity>

          <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActivePage("contacts")}>
            <Text>Contacts</Text>
          </TouchableOpacity>

          <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActivePage("settings")}>
            <Text>Settings</Text>
          </TouchableOpacity>
        </View>
      </>
    )
}

const styles = {
  navContainer : {
    backgroundColor : "white",
    flexDirection : "row",
    justifyContent : "space-between"
  },
  navItem : {
    padding : 20
  }
}

export default Main
