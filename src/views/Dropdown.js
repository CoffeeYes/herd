import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import {palette} from '../assets/palette';
import Icon from 'react-native-vector-icons/MaterialIcons';

const Dropdown = ({ choices, defaultIndex = 0, onChangeOption, containerStyle,
                    itemStyle, textStyle, chosenStyle, choiceContainerStyle, choiceStyle }) => {
  const [open, setOpen] = useState(false);
  const [chosenIndex, setChosenIndex] = useState(defaultIndex);

  const handleChoicePress = (index) => {
    setChosenIndex(index);
    setOpen(false);

    onChangeOption &&
    onChangeOption(index);
  }
  return (
    <View style={{...styles.container, ...containerStyle}}>
      <TouchableOpacity style={{...styles.choice, borderBottomWidth : 2}} onPress={() => setOpen(!open)}>
        <Text style={{...styles.text,...textStyle}}>{choices[chosenIndex].text}</Text>
        <Icon
        size={24}
        style={{marginLeft : "auto"}}
        name="arrow-downward"/>
      </TouchableOpacity>
      {open &&
      <View style={{...styles.choiceContainer, ...choiceContainerStyle}}>
        {choices.map((choice,index) => {
          return (
            <TouchableOpacity
            activeOpacity={1}
            style={{
              ...styles.choice,
              borderBottomColor : palette.grey,
              ...(index === choices.length -1 && {borderBottomWidth : 0}),
              ...choiceStyle
            }}
            key={choice.name}
            onPress={() => handleChoicePress(index)}>
              <Text style={{
                ...styles.text,
                ...textStyle,
                ...(index === chosenIndex && {...chosenStyle})
              }}>
                {choice.text}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>}
    </View>
  )
}

const styles = {
  container : {
    width : "100%",
    position : "relative"
  },
  choiceContainer : {
    position : "absolute",
    zIndex : 999,
    width : "100%",
    top : "100%",
    elevation : 10,
    borderWidth : 0.1,
  },
  choice : {
    backgroundColor : palette.white,
    width : "100%",
    padding : 20,
    borderBottomWidth : 1,
    borderColor : palette.black,
    flexDirection : "row",
    alignItems : "center"
  },
  text : {
    color : palette.black,
    fontWeight : "bold"
  }
}

export default Dropdown;
