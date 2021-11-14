import React from 'react';
import { TouchableOpacity, Text} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const Card = ({ onPress, text, icon, iconSize , cardStyle, textStyle,
                disabled, errorText }) => {
  return (
    <TouchableOpacity
    disabled={disabled}
    onPress={onPress}
    style={{...styles.card, ...cardStyle}}>
      {errorText?.length > 0 &&
      <Text style={styles.error}>{errorText}</Text>}

      <Icon name={icon} size={iconSize}/>
      <Text style={{...styles.text, ...textStyle}}>{text}</Text>
    </TouchableOpacity>
  )
}

const styles = {
  error : {
    color : "red",
    fontWeight : "bold",
    textAlign : "center",
    fontSize : 18
  },
  card : {
    padding : 20,
    flex : 1,
    backgroundColor : "white",
    borderRadius : 5,
    alignItems : "center",
    justifyContent : "center"
  },
  text : {
    color : "black",
    marginTop : 10
  },
}

export default Card;
