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

const updatePassword = (passwordName,passwordHash) => {
  const password = passwordRealm.objects('Password').filtered(`name = '${passwordName}'`)[0];

  password &&
  passwordRealm.write(() => {
    passwordRealm.create('Password',{
      ...password,
      hash : passwordHash,
      _id : Realm.BSON.ObjectId(password._id)},
    true);
  })
}

const getPasswordHash = name => {
  const hash = passwordRealm.objects('Password').filtered(`name = '${name}'`)[0]
  return hash ? hash.hash : "";
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
