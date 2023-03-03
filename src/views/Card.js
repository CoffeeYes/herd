import React from 'react';
import { useSelector } from 'react-redux';
import { TouchableOpacity, Text} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { palette } from '../assets/palette';

const Card = ({ onPress, text, icon, iconSize , cardStyle, textStyle,
                disabled, errorText }) => {
  const customStyle = useSelector(state => state.chatReducer.styles);
  
  return (
    <TouchableOpacity
    disabled={disabled}
    onPress={onPress}
    style={{...styles.card, ...cardStyle}}>
      {errorText?.length > 0 &&
      <Text style={styles.error}>{errorText}</Text>}

      {icon &&
      <Icon name={icon} size={iconSize}/>}

      {text &&
      <Text style={{
        ...styles.text,
        fontSize : customStyle.uiFontSize,
        ...textStyle}}>{text}</Text>}
    </TouchableOpacity>
  )
}

const styles = {
  error : {
    color : palette.red,
    fontWeight : "bold",
    textAlign : "center",
    fontSize : 18
  },
  card : {
    padding : 20,
    flex : 1,
    backgroundColor : palette.white,
    borderRadius : 5,
    alignItems : "center",
    justifyContent : "center",
    elevation : 2,
  },
  text : {
    color : palette.black,
    marginTop : 10
  },
}

export default Card;
