import Realm from 'realm';
import Schemas from './Schemas';
import { deleteChat } from './chatRealm';
import { cloneDeep } from 'lodash';
import { parseRealmObjects } from './helper'

const contactsRealm = new Realm({
  path : 'contacts',
  schema : [Schemas.ContactSchema]
})

const getAllContacts = () => {
  const allContacts = contactsRealm.objects("Contact");
  return allContacts.length > 0 ?
  parseRealmObjects(allContacts)
  :
  []
}

const deleteContact = object => {
  deleteChat(object.key);
  contactsRealm.write(() => {
    contactsRealm.delete(object);
  })
}

const createContact = object => {
  let newContact;
  contactsRealm.write(() => {
    newContact = contactsRealm.create('Contact',{...object,_id : Realm.BSON.ObjectId()});
  })
  return newContact;
}

const getContactById = id => {
  let oid = Realm.BSON.ObjectId(id)
  const contact = contactsRealm.objectForPrimaryKey("Contact",oid);
  return contact._id ? contact : {}
}

const getContactsByKey = keys => {
  if(keys.length > 0) {
    const keyQuery = keys.map(key => "key = " + "'" + key + "'").join(' OR ');
    const contactsByKey = contactsRealm.objects('Contact').filtered(keyQuery);
    return contactsByKey.length > 0 ? parseRealmObjects(contactsByKey) : []
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
