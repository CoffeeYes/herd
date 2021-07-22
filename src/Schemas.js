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
  }
}

export default Schemas;
