import Realm from 'realm';
import Schemas from '../Schemas';

const contactsRealm = new Realm({
  path : 'contacts',
  schema : [Schemas.ContactSchema]
})

const getAllContacts = () => {
  return contactsRealm.objects('Contact');
}

const deleteContact = object => {
  contactsRealm.write(() => {
    contactsRealm.delete(object);
  })
}

const createContact = object => {
  contactsRealm.write(() => {
    contactsRealm.create('Contact',{...object,_id : Realm.BSON.ObjectId()});
  })
}

const getContactById = id => {
  let oid = Realm.BSON.ObjectId(id)
  return contactsRealm.objectForPrimaryKey("Contact",oid);
}

const getContactsByKey = keys => {
  const keyQuery = keys.map(key => "key = " + "'" + key + "'").join(' OR ');
  return contactsRealm.objects('Contact').filtered(keyQuery);
}

const closeContactRealm = () => {
  contactsRealm.close();
}

export {
  getAllContacts,
  deleteContact,
  createContact,
  getContactById,
  getContactsByKey,
  closeContactRealm
}
