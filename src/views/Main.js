import React from 'react';
import { View, ScrollView, Text,} from 'react-native';

const Main = ({ navigation }) => {
    return(
      <ScrollView>
        <View style={styles.navContainer}>
          <View>
            <Text>Chats</Text>
          </View>

          <View>
            <Text>Contacts</Text>
          </View>

          <View>
            <Text>Settings</Text>
          </View>
        </View>
      </ScrollView>
    )
}

const styles = {
  navContainer : {
    backgroundColor : "white",
    flexDirection : "row",
    justifyContent : "space-between"
  },
}

export default Main
