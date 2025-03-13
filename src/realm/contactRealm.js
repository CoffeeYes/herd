import Realm from 'realm';
import Schemas from './Schemas';
import { deleteChats, updateMessagesWithContact } from './chatRealm';
import { parseRealmObject, parseRealmObjects } from '../helper'

const contactsRealm = new Realm({
  path : 'contacts',
  schema : [Schemas.ContactSchema]
})

const getAllContacts = () => {
  const allContacts = contactsRealm.objects("Contact");
  return parseRealmObjects(allContacts)
}

const deleteContacts = contacts => {
  const contactIDs = contacts.map(contact => Realm.BSON.ObjectId(contact._id))
  const contactsToDelete = contactsRealm.objects("Contact").filtered(`_id IN $0`,contactIDs);
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
  const contactsByKey = contactsRealm.objects('Contact').filtered(`key IN $0`,keys);
  return parseRealmObjects(contactsByKey)
}

const editContact = async (values) => {
  const contact = getContactById(Realm.BSON.ObjectId(values._id));
  const oldKey = contact.key;
  let messagesUpdated = false;

  if(values.key !== oldKey) {
    messagesUpdated = await updateMessagesWithContact(oldKey,values.key);
  }

  const validKeys = Object.keys(Schemas.ContactSchema.properties)
  .filter(key => key !== "_id");

  contactsRealm.write(() => {
    for(const key of  Object.keys(values).filter(key => key !== "_id")) {
      if (validKeys.includes(key)) {
        if(key == "key") {
          if(messagesUpdated) {
            contact[key] = values[key];
          }
        }
        else {
          contact[key] = values[key]
        }
      }
      else {
        throw new Error(`invalid key ${key} passed in value object when attempting to update contact`)
      }
    }
  })
  return messagesUpdated;
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
  getContactsByKey,
  editContact,
  deleteAllContacts,
  closeContactRealm
}
