import { closeChatRealm, deleteChatRealm, openChatRealm } from '../src/realm/chatRealm.js';
import { 
  openContactRealm,
  createContact, 
  getAllContacts,
  deleteContacts, 
  closeContactRealm,
  deleteContactRealm,
  getContactById,
  editContact,
  getContactsByKey,
  deleteAllContacts} from '../src/realm/contactRealm.js';

const testContact1 = {
  name : "test",
  key : `MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA6Aj7TtjaaostNXW4lwLMeE0I48PoNGKl
        vnQPMRF8TiJ3U5UOeWE5huUYOSnnEzc1LAuh3cuzjtmMB7BbJzsCGV9ZpeKWGFuEqLOFh6/HIYX+
        tzU7IJZc8Hede5BvoyUonzsOsvehCKVlwYlRQdCvsFsrPPsm4qGsMVhbB4ObCA/ELscy8SaA2mc9
        rfR8DiQC4ObO8A7VZlUWHtp0VEpKbnKsXKL9picFfrOJ/HjFZQnmGcbaM1PPazHSvPmJsLB8lHNf
        HauZVHmf4ykKKYt2lzkI4KLZ1RV5rmVXd+XNM9PIKgT5cfnaZViQNsIemcYeljVX/G9qVT8QJ9Kf
        fox+nQIDAQAB`,
  image : ""
}

const testContact2 = {
  name : "test2",
  key : `MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA6Aj7TtjaaostNXW4lwLMeE0I48PoNGKl
        vnQPMRF8TiJ3U5UOeWE5huUYOSnnEzc1LAuh3cuzjtmMB7BbJzsCGV9ZpeKWGFuEqLOFh6/HIYX+
        tzU7IJZc8Hede5BvoyUonzsOsvehCKVlwYlRQdCvsFsrPPsm4qGsMVhbB4ObCA/ELscy8SaA2mc9
        rfR8DiQC4ObO8A7VZlUWHtp0VEpKbnKsXKL9picFfrOJ/HjFZQnmGcbaM1PPazHSvPmJsLB8lHNf
        HauZVHmf4ykKKYt2lzkI4KLZ1RV5rmVXd+XNM9PIKgT5cfnaZViQNsIemcYeljVX/G9qVT8QJ9Kf
        fox+nQIDAQAL`,
  image : ""
}

beforeEach(async () => {
  await openContactRealm();
  await openChatRealm();
})

afterEach(() => {
  closeContactRealm();
  deleteContactRealm();
  closeChatRealm();
  deleteChatRealm();
})

it("create contact", () => {
  createContact(testContact1);
  const contacts = getAllContacts();
  expect(contacts.length).toBe(1);
  expect(contacts[0].name).toBe(testContact1.name);
  expect(contacts[0].key).toBe(testContact1.key);
  expect(contacts[0].image).toBe(testContact1.image);
  expect(contacts[0]._id).toBeDefined();
})

it("delete a single contact", () => {
  const contact = createContact(testContact1);
  let contacts = getAllContacts();
  expect(contacts.length).toBe(1);
  deleteContacts([contact]);
  contacts = getAllContacts();
  expect(contacts.length).toBe(0);
})

it("create multiple contacts",() => {
  createContact(testContact1);
  createContact(testContact2);
  const contacts = getAllContacts();
  expect(contacts.length).toBe(2);
})

it("delete multiple contacts",() => {
  const contact1 = createContact(testContact1);
  const contact2 = createContact(testContact2);
  let contacts = getAllContacts();
  expect(contacts.length).toBe(2);
  deleteContacts([contact1,contact2]);
  contacts = getAllContacts();
  expect(contacts.length).toBe(0);
})

it("delete correct contact out of multiple", () => {
  const contact1 = createContact(testContact1);
  const contact2 = createContact(testContact2);
  let contacts = getAllContacts();
  expect(contacts.length).toBe(2);
  deleteContacts([contact2]);
  contacts = getAllContacts();
  expect(contacts.length).toBe(1);
  expect(contacts[0]).toEqual(contact1);
})

it("delete all contacts", () => {
  createContact(testContact1);
  createContact(testContact2);
  let contacts = getAllContacts();
  expect(contacts.length).toBe(2);
  deleteAllContacts();
  contacts = getAllContacts();
  expect(contacts.length).toBe(0);
})

it("retrieve contact by ID", () => {
  const contact = createContact(testContact1);
  const retrievedContact = getContactById(contact._id);
  expect(retrievedContact).toBeDefined();
  expect(retrievedContact.name).toEqual(contact.name);
  expect(retrievedContact.key).toEqual(contact.key);
  expect(retrievedContact.image).toEqual(contact.image);
})

it("retrieve contact by key", () => {
  const contact = createContact(testContact1);
  const retrievedContact = getContactsByKey([contact.key]);
  expect(retrievedContact.length).toBe(1);
  expect(retrievedContact[0].name).toEqual(contact.name);
  expect(retrievedContact[0].key).toEqual(contact.key);
  expect(retrievedContact[0].image).toEqual(contact.image);
})

it("retrieve multiple contacts by key", () => {
  const contact1 = createContact(testContact1);
  const contact2 = createContact(testContact2);
  const retrievedContacts = getContactsByKey([contact1.key, contact2.key]);
  expect(retrievedContacts.length).toBe(2);
})

it("update a contact", async () => {
  const {_id} = createContact(testContact1);
  await editContact({_id, name : "testing", image : "testing", key : testContact2.key})
  const retrievedContact = getContactById(_id);
  expect(retrievedContact.name).toBe("testing");
  expect(retrievedContact.image).toBe("testing");
  expect(retrievedContact.key).toBe(testContact2.key);
})
