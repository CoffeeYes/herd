import moment from 'moment';

const timestampToText = (timestamp,format) => {
  const today = moment();
  const yesterday = moment().subtract(1,"days");
  const dateToParse = moment(timestamp);

  if(today.format("DD/MM/YYYY") == dateToParse.format("DD/MM/YYYY")) {
    return "Today";
  }
  else if (yesterday.format("DD/MM/YYYY") == dateToParse.format("DD/MM/YYYY")) {
    return "Yesterday"
  }
  else {
    return dateToParse.format(format);
  }
}

export {
  timestampToText
}
