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
export {
  parseRealmID,
  parseRealmObject,
  parseRealmObjects
}
