import Realm from 'realm';
import Schemas from './Schemas';
import { deleteChats, updateMessagesWithContact } from './chatRealm';
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
    const keyQuery = keys.map(key => `key = '${key}'`).join(' OR ');
    const contactsByKey = contactsRealm.objects('Contact').filtered(keyQuery);
    return parseRealmObjects(contactsByKey)
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
  getContactByName,
  getContactsByKey,
  editContact,
  deleteAllContacts,
  closeContactRealm
}
