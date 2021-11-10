import Realm from 'realm';
import Schemas from '../Schemas';
import { deleteChat } from './chatRealm';
import { cloneDeep } from 'lodash';

const contactsRealm = new Realm({
  path : 'contacts',
  schema : [Schemas.ContactSchema]
})

const getAllContacts = () => {
  return contactsRealm.objects('Contact');
}

const deleteContact = object => {
  deleteChat(object.key);
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
  if(keys.length > 0) {
    const keyQuery = keys.map(key => "key = " + "'" + key + "'").join(' OR ');
    return contactsRealm.objects('Contact').filtered(keyQuery);
  }
  else {
    return []
  }
}

const editContact = (id, values) => {
  const contact = getContactById(Realm.BSON.ObjectId(id));
  contactsRealm.write(() => {
    contact.name = values.name;
    contact.key = values.key;
    contact.image = values.image;
  })
}

const deleteAllContacts = () => {
  contactsRealm.write(() => contactsRealm.deleteAll())
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
  editContact,
  deleteAllContacts,
  closeContactRealm
}
