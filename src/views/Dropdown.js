import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import {palette} from '../assets/palette';
import Icon from 'react-native-vector-icons/MaterialIcons';

const Dropdown = ({ choices, defaultIndex = 0, onChangeOption, containerStyle, dropDownBoxStyle,
                    textStyle, chosenStyle, choiceContainerStyle, choiceStyle }) => {
  const [open, setOpen] = useState(false);
  const [chosenIndex, setChosenIndex] = useState(defaultIndex);

  const handleChoicePress = (index) => {
    setChosenIndex(index);
    setOpen(false);

    onChangeOption?.(index);
  }
  return (
    <View style={{...styles.container, ...containerStyle}}>

      <Pressable
      style={{...styles.choice, borderBottomWidth : 2,...dropDownBoxStyle}}
      onPress={() => setOpen(!open)}>
        <Text style={{...styles.text,...textStyle}}>{choices[chosenIndex].text}</Text>
        <Icon
        size={24}
        style={{marginLeft : "auto"}}
        name={open ? "arrow-back" : "arrow-downward"}/>
      </Pressable>

      {open &&
      <View style={{...styles.choiceContainer, ...choiceContainerStyle}}>
        {choices.map((choice,index) => {
          return (
            <Pressable
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
            </Pressable>
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
