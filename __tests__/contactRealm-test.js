import Realm from 'realm';
import { contactRealmConfig, createContact, getAllContacts } from '../src/realm/contactRealm.js';

const testContact = {
  _id : Realm.BSON.ObjectId(),
  name : "test",
  key : `MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA6Aj7TtjaaostNXW4lwLMeE0I48PoNGKl
        vnQPMRF8TiJ3U5UOeWE5huUYOSnnEzc1LAuh3cuzjtmMB7BbJzsCGV9ZpeKWGFuEqLOFh6/HIYX+
        tzU7IJZc8Hede5BvoyUonzsOsvehCKVlwYlRQdCvsFsrPPsm4qGsMVhbB4ObCA/ELscy8SaA2mc9
        rfR8DiQC4ObO8A7VZlUWHtp0VEpKbnKsXKL9picFfrOJ/HjFZQnmGcbaM1PPazHSvPmJsLB8lHNf
        HauZVHmf4ykKKYt2lzkI4KLZ1RV5rmVXd+XNM9PIKgT5cfnaZViQNsIemcYeljVX/G9qVT8QJ9Kf
        fox+nQIDAQAB`,
  image : ""
}

let contactsRealm;
beforeEach(async () => {
  contactsRealm = await Realm.open(contactRealmConfig)
})

afterEach(async () => {
  if(!contactsRealm.isClosed) {
    contactsRealm.close()
  }
  Realm.deleteFile(contactRealmConfig);
})

it("can create contact", () => {
  createContact(testContact);
  const contacts = getAllContacts();
  expect(contacts.length).toBe(1);
  expect(contacts[0].name).toBe(testContact.name);
  expect(contacts[0].key).toBe(testContact.key);
  expect(contacts[0].image).toBe(testContact.image);
})
