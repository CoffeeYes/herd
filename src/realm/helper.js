const parseRealmID = object => {
  if (typeof JSON.parse(JSON.stringify(object))._id === 'string') {
    return JSON.parse(JSON.stringify(object))._id
  }
  else {
    return object._id[1]
  }
}

export {
  parseRealmID
}
