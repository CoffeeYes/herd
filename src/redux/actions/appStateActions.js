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

export {
  setInitialRoute,
  setLocked,
  setLastRoutes
}
