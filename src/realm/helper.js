const parseRealmID = object => {
  try {
    if (typeof JSON.parse(JSON.stringify(object))._id === 'string') {
      return JSON.parse(JSON.stringify(object))._id
    }
    else {
      return object._id[1]
    }
  }
  catch(e) {
    console.log("Error parsing realm ID : " + e)
  }
}

export {
  parseRealmID
}
