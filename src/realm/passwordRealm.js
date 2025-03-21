import Realm from 'realm';
import Schemas from './Schemas';

const passwordRealm = new Realm({
  path : 'passwords',
  schema : [Schemas.PasswordSchema]
})

const updatePassword = (passwordName,passwordHash) => {
  const password = passwordRealm.objects('Password').filtered(`name = '${passwordName}'`)[0] || {};

  passwordRealm.write(() => {
    passwordRealm.create(
      'Password',
      {
      ...password,
      name : passwordName,
      hash : passwordHash,
      _id : password._id ? Realm.BSON.ObjectId(password._id) : Realm.BSON.ObjectId()
      },
      true
    );
  })
}

const getPasswordHash = name => {
  const hash = passwordRealm.objects('Password').filtered(`name = '${name}'`)[0]
  return hash ? hash.hash : "";
}

const deletePassword = name => {
  const password = passwordRealm.objects('Password').filtered(`name = '${name}'`)[0];
  password &&
  passwordRealm.write(() => {
    passwordRealm.delete(password);
  })
}

const closePasswordRealm = () => {
  passwordRealm.close();
}

export {
  updatePassword,
  getPasswordHash,
  deletePassword,
  closePasswordRealm
}
