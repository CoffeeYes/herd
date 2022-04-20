import Realm from 'realm';
import Schemas from '../Schemas';

const passwordRealm = new Realm({
  path : 'passwords',
  schema : [Schemas.PasswordSchema]
})

const createNewPassword = (passwordName,passwordHash) => {
  passwordRealm.write(() => {
    passwordRealm.create('Password',{
      _id : Realm.BSON.ObjectId(),
      name : passwordName,
      hash : passwordHash
    })
  })
}

const updatePassword = object => {
  passwordRealm.write(() => {
    passwordRealm.create('Password',object,true);
  })
}

const getPasswordHash = name => {
  const hash = passwordRealm.objects('Password').filter(`name = '${name}'`)
  return hash;
}

const deletePassword = id => {
  passwordRealm.write(() => {
    passwordRealm.delete(id);
  })
}

export {
  createNewPassword,
  updatePassword,
  getPasswordHash,
  deletePassword
}
