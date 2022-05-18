const Schemas = {
  MessageSchema : {
    name : 'Message',
    primaryKey : "_id",
    properties : {
      _id : 'objectId',
      to : 'string',
      from : 'string',
      text : 'string',
      timestamp : 'int'
    }
  },
  ContactSchema : {
    name : 'Contact',
    primaryKey : "_id",
    properties : {
      _id : 'objectId',
      key : 'string',
      name : 'string',
      image : 'string'
    }
  },
  PasswordSchema : {
    name : "Password",
    primaryKey : "_id",
    properties : {
      _id : "objectId",
      name : "string",
      hash : "string",
    }
  }
}

export default Schemas;
