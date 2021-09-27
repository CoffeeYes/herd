const parseRealmID = object => {
  try {
    const copy = {...object};
    const parsedCopy = JSON.parse(JSON.stringify(object))
    if (typeof parsedCopy._id === 'string') {
      return parsedCopy._id
    }
    else {
      return copy._id[1]
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
