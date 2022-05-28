import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Text, View, TouchableOpacity, ActivityIndicator, Dimensions, Image, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from './Header';
import ListItem from './ListItem';
import { getContactsWithChats, deleteChat as deleteChatFromRealm } from '../realm/chatRealm';
import { parseRealmID } from '../realm/helper';
import moment from 'moment';
import { toHsv } from 'react-native-color-picker';

import { deleteChat as deleteChatFromState } from '../redux/actions/chatActions';

const Chats = ({ navigation }) => {
  const dispatch = useDispatch();

  const chats = useSelector(state => state.chatReducer.chats);
  const [loading, setLoading] = useState(true);
  const [sentTextColor, setSentTextColor] = useState("");
  const [receivedTextColor, setReceivedTextColor] = useState("");

  useEffect(() => {
    setLoading(true);
    (async () => {
      loadStyles();
    })()
    setLoading(false);
  },[])

  useEffect(() => {
    const focusListener = navigation.addListener('focus', () => {
      loadStyles();
    });
    return focusListener;
  },[navigation])

  const loadStyles = async () => {
    const styles = JSON.parse(await AsyncStorage.getItem("styles"));

    if(styles) {
      const hsvSent = toHsv(styles.sentTextColor);
      const hsvReceived = toHsv(styles.receivedTextColor);

      if(hsvSent.h < 10 && hsvSent.s < 10 && hsvSent.v > 0.95) {
        setSentTextColor("grey")
      }
      else {
        setSentTextColor(styles.sentTextColor)
      }
      if(hsvReceived.h < 10 && hsvReceived.s < 10 && hsvReceived.v > 0.95) {
        setReceivedTextColor("grey")
      }
      else {
        setReceivedTextColor(styles.receivedTextColor)
      }
    }
  }

  const deleteChat = chat => {
    Alert.alert(
      'Are you sure ?',
      '',
      [
        { text: "Cancel", style: 'cancel', onPress: () => {} },
        {
          text: 'Delete',
          style: 'destructive',
          // If the user confirmed, then we dispatch the action we blocked earlier
          // This will continue the action that had triggered the removal of the screen
          onPress: () => {
            dispatch(deleteChatFromState(chat))
            deleteChatFromRealm(chat.key)
          },
        },
      ]
    );

  }

  return (
    <>
      <Header
      title="Chats"
      rightButtonIcon="add"
      rightButtonOnClick={() => navigation.navigate("newChat",{type : "newChat", disableAddNew : true})}/>

      {loading && <ActivityIndicator size="large" color="#e05e3f"/>}
      <ScrollView>
      {chats?.map( (chat, index) =>
        <ListItem
        name={chat.name}
        key={index}
        navigation={navigation}
        image={chat.image}
        textStyle={{fontWeight : "bold"}}
        subTextStyle={{
          color : chat.lastMessageSentBySelf ? sentTextColor : receivedTextColor,
          ...(!chat.lastMessageSentBySelf && {fontWeight : "bold"})
        }}
        rightTextStyle={{
          color : chat.lastMessageSentBySelf ? sentTextColor : receivedTextColor,
          ...(!chat.lastMessageSentBySelf && {fontWeight : "bold"})
        }}
        rightIcon={!chat.lastMessageSentBySelf && "circle"}
        rightIconSize={18}
        rightIconStyle={{color : "#E86252"}}
        onPress={() => navigation.navigate("chat", {contactID : parseRealmID(chat)})}
        deleteItem={() => deleteChat(chat)}
        rightText={chat.timestamp &&
          (moment(chat.timestamp).format("DD/MM") === moment().format("DD/MM") ?
            "Today"
            :
            moment(chat.timestamp).format("DD/MM"))
        }
        subText={chat.lastText}/>
      )}
      </ScrollView>
    </>
  )
}

export default Chats;
