import Crypto from '../../nativeWrapper/Crypto';

const setPublicKey = key => ({
  type : "SET_PUBLIC_KEY",
  payload : key
})

export {
  setPublicKey,
}
