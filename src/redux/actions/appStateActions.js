const setInitialRoute = route => {
  return {
    type : "SET_INITIAL_ROUTE",
    payload : route
  }
}

const setLocked = locked => {
  return {
    type : "SET_LOCKED",
    payload : locked
  }
}

const setLockable = lockable => {
  return {
    type : "SET_LOCKABLE",
    payload : lockable
  }
}

const setLastRoutes = routes => {
  return {
    type : "SET_LAST_ROUTES",
    payload : routes
  }
}

const setMaxPasswordAttempts = maxAttempts => {
  return {
    type : "SET_MAX_PASSWORD_ATTEMPTS",
    payload : maxAttempts
  }
}

const setEnableNotifications = enable => {
  return {
    type : "SET_ENABLE_NOTIF",
    payload : enable
  }
}

const setBackgroundServiceRunning = running => {
  return {
    type : "SET_BACKGROUND_SERVICE_RUNNING",
    payload : running
  }
}

const setStyles = styles => {
  return {
    type : "SET_STYLES",
    payload : styles
  }
}

export {
  setInitialRoute,
  setLocked,
  setLockable,
  setLastRoutes,
  setMaxPasswordAttempts,
  setEnableNotifications,
  setBackgroundServiceRunning,
  setStyles
}
