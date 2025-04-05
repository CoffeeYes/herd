import Realm from 'realm';
import { 
  openContactRealm,
  createContact, 
  getAllContacts,
  deleteContacts, 
  closeContactRealm,
  deleteContactRealm} from '../src/realm/contactRealm.js';

const testContact = {
  name : "test",
  key : `MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA6Aj7TtjaaostNXW4lwLMeE0I48PoNGKl
        vnQPMRF8TiJ3U5UOeWE5huUYOSnnEzc1LAuh3cuzjtmMB7BbJzsCGV9ZpeKWGFuEqLOFh6/HIYX+
        tzU7IJZc8Hede5BvoyUonzsOsvehCKVlwYlRQdCvsFsrPPsm4qGsMVhbB4ObCA/ELscy8SaA2mc9
        rfR8DiQC4ObO8A7VZlUWHtp0VEpKbnKsXKL9picFfrOJ/HjFZQnmGcbaM1PPazHSvPmJsLB8lHNf
        HauZVHmf4ykKKYt2lzkI4KLZ1RV5rmVXd+XNM9PIKgT5cfnaZViQNsIemcYeljVX/G9qVT8QJ9Kf
        fox+nQIDAQAB`,
  image : ""
}

beforeEach(async () => {
  await openContactRealm();
})

afterEach(() => {
  closeContactRealm();
  deleteContactRealm();
})

it("can create contact", () => {
  createContact(testContact);
  const contacts = getAllContacts();
  expect(contacts.length).toBe(1);
  expect(contacts[0].name).toBe(testContact.name);
  expect(contacts[0].key).toBe(testContact.key);
  expect(contacts[0].image).toBe(testContact.image);
  expect(contacts[0]._id).toBeDefined();
})

it("can delete a single contact, entire object", () => {
  const contact = createContact(testContact);
  let contacts = getAllContacts();
  expect(contacts.length).toBe(1);
  deleteContacts([contact]);
  contacts = getAllContacts();
  expect(contacts.length).toBe(0);
})

