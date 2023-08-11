const parseRealmID = object => {
    //determine whether id is in array form or string form and return appropriate value
    if(object?._id?.[0] === "$oid") {
      return object._id[1];
    }
    else {
      return object?._id?.toString();
    }
}

const parseRealmObject = object => {
  return ({...JSON.parse(JSON.stringify(object))})
}

const parseRealmObjects = objects => {
  return objects?.map(object => parseRealmObject(object)) || []
}

const getUniqueKeysFromMessages = (messages = [], toOrFrom) => {
  if(!["to","from"].includes(toOrFrom)) {
    throw new Error("getUniqueKeysFromMessages parameter toOrFrom is not equal to either 'to' or 'from'")
  }
  let keys = [];
  for(message of messages) {
    const key = message[toOrFrom].trim();
    if(!keys.includes(key)) {
      keys.push(key)
    }
  }
  return keys;
}
export {
  parseRealmID,
  parseRealmObject,
  parseRealmObjects,
  getUniqueKeysFromMessages
}
