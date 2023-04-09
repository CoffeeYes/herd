import Realm from 'realm';
import Schemas from './Schemas';
import { deleteChats, updateMessagesWithContact } from './chatRealm';
import { cloneDeep } from 'lodash';
import { parseRealmObject, parseRealmObjects, parseRealmID} from './helper'

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

const deleteContacts = contacts => {
  const realmContacts = contactsRealm.objects("Contact");
  const contactsToDelete = realmContacts.filter(contact => contacts.find(item => parseRealmID(item) == parseRealmID(contact)) !== undefined);
  deleteChats(contacts.map(contact => contact.key))
  contactsRealm.write(() => {
    contactsRealm.delete(contactsToDelete);
  })
}

const createContact = object => {
  let newContact;
  contactsRealm.write(() => {
    newContact = contactsRealm.create('Contact',{...object,_id : Realm.BSON.ObjectId()});
  })
  return parseRealmObject(newContact);
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

const getContactByName = name => {
  const contact = contactsRealm.objects('Contact').filtered(`name =[c] '${name}'`);

  return contact.length > 0 ?
  parseRealmObject(contact[0])
  :
  false
}

const editContact = async (id, values) => {
  const contact = getContactById(Realm.BSON.ObjectId(id));
  const oldKey = contact.key;
  await updateMessagesWithContact(oldKey,values.key);
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
  deleteContacts,
  createContact,
  getContactById,
  getContactByName,
  getContactsByKey,
  editContact,
  deleteAllContacts,
  closeContactRealm
}
