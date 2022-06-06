const initialState = {
  initialRoute : ""
}

const appStateReducer = (state=initialState, action) => {
  switch(action.type) {
    case "SET_INITIAL_ROUTE":
      return {...state, initialRoute : action.payload}
    default:
      return state;
  }
}

export default appStateReducer;
