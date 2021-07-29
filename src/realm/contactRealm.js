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
  return contactsRealm.objectForPrimaryKey("Contact",id);
}

export {
  getAllContacts,
  deleteContact,
  createContact,
  getContactById
}
