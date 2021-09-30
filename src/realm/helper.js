const parseRealmID = object => {
  try {
    if(object._id.length === 2) {
      return object._id[1];
    }
    else if (object._id) {
      return JSON.parse(JSON.stringify(object))._id;
    }
    else {
      console.log(object._id.length)
      throw "Error Parsing Realm Object : Object did not Conform to exptected Object Structure"
    }
  }
  catch(e) {
    console.log("Error parsing realm ID : " + e)
    console.log(object)
  }
}

export {
  parseRealmID
}
