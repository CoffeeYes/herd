const initialState = {
  initialRoute : "",
  locked : false
}

const appStateReducer = (state=initialState, action) => {
  switch(action.type) {
    case "SET_INITIAL_ROUTE":
      return {...state, initialRoute : action.payload};
      break;
    case "SET_LOCKED":
      return {...state, locked : action.payload};
      break;
    default:
      return state;
  }
}

export default appStateReducer;
