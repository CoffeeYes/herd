const setPublicKey = key => ({
  type : "SET_PUBLIC_KEY",
  payload : key
})

const setPassword = (passwordName, hash) => {
  let type;
  if(passwordName === "login") {
    type = "SET_LOGIN_PASSWORD";
  }
  else if(passwordName === "erasure") {
    type = "SET_ERASURE_PASSWORD";
  }
  else {
    throw new Error("Unknown passwordName passed to setPassword function, does not match 'login' or 'erasure'");
  }

  return {
    type : type,
    payload : hash
  }
}

export {
  setPublicKey,
  setPassword
}
