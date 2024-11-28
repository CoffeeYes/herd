const initialState = {
  locked : false,
  lockable : true,
  lastRoutes : [],
  maxPasswordAttempts: 3,
  sendNotificationForNewMessages : true,
  backgroundServiceRunning : false
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
    case "SET_ENABLE_NOTIF" : {
      return {...state, sendNotificationForNewMessages : action.payload}
    }
    case "SET_BACKGROUND_SERVICE_RUNNING": {
      return {...state, backgroundServiceRunning : action.payload}
    }
    default:
      return state;
  }
}

export default appStateReducer;
