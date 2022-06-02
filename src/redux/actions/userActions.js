import Crypto from '../../nativeWrapper/Crypto';

const setPublicKey = key => ({
  type : "SET_PUBLIC_KEY",
  payload : key
})

const setPassword = (passwordName, hash) => {
  return {
    type : passwordName === "login" ? "SET_LOGIN_PASSWORD" : "SET_ERASURE_PASSWORD",
    payload : hash
  }
}

export {
  setPublicKey,
  setPassword
}
