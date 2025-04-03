import Realm from 'realm';
import Schemas from './Schemas';
import { deleteChats, updateMessagesWithContact } from './chatRealm';
import { parseRealmObject, parseRealmObjects } from '../helper'

const contactRealmConfig = {
  path : 'contacts',
  schema : [Schemas.ContactSchema]
}

const contactsRealm = new Realm(contactRealmConfig);

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
  //have to manually chain keys with OR as IN query does not currently function correctly with strings
  if(keys.length > 0) {
    const keyQuery = keys.map(key => `key = '${key}'`).join(' OR ');
    const contactsByKey = contactsRealm.objects('Contact').filtered(keyQuery);
    return parseRealmObjects(contactsByKey)
  }
  else {
    return []
  }
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

const deleteContactRealm = () => {
  Realm.deleteFile(contactRealmConfig);
}

export {
  getAllContacts,
  deleteContacts,
  createContact,
  getContactById,
  getContactsByKey,
  editContact,
  deleteAllContacts,
  closeContactRealm,
  deleteContactRealm,
  contactRealmConfig
}
