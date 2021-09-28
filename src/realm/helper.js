const parseRealmID = object => {
  try {
    if(object._id[1]) {
      return object._id[1];
    }
    else {
      return object._id;
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
