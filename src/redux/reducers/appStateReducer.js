const initialState = {
  locked : false,
  lockable : true,
  lastRoutes : [],
  maxPasswordAttempts: 3
}

const appStateReducer = (state=initialState, action) => {
  switch(action.type) {
    case "SET_LOCKED": {
      return {...state, locked : action.payload};
    }
    case "SET_LOCKABLE": {
      return {...state, lockable : action.payload};
    }
    case "SET_LAST_ROUTES" : {
      return {...state, lastRoutes : action.payload};
    }
    case "SET_MAX_PASSWORD_ATTEMPTS": {
      return {...state, maxPasswordAttempts : action.payload};
    }
    default:
      return state;
  }
}

export default appStateReducer;
