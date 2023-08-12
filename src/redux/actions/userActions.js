const setPublicKey = key => ({
  type : "SET_PUBLIC_KEY",
  payload : key
})

const setPassword = (passwordName, hash) => {
  let type;
  if(!["login","erasure"].includes(passwordName)) {
    throw new Error("Unknown passwordName passed to setPassword function, does not match 'login' or 'erasure'");
  }

  return {
    type : "SET_PASSWORD",
    payload : {hash, passwordName}
  }
}

export {
  setPublicKey,
  setPassword
}
