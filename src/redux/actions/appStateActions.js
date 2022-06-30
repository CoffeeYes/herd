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

export {
  setInitialRoute,
  setLocked
}
