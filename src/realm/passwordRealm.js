import Realm from 'realm';
import Schemas from './Schemas';

const passwordRealmConfig = {
  path : 'passwords',
  schema : [Schemas.PasswordSchema]
}

let passwordRealm;

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

const openPasswordRealm = async () => {
  passwordRealm = await Realm.open(passwordRealmConfig);
}

const closePasswordRealm = () => {
  passwordRealm.close();
}

const deletePasswordRealm = () => {
  Realm.deleteFile(passwordRealmConfig);
}

export {
  updatePassword,
  getPasswordHash,
  deletePassword,
  openPasswordRealm,
  closePasswordRealm,
  deletePasswordRealm
}
