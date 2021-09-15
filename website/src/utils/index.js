import axios from "./axios";

function orderAlphabetically(string1 = "", string2 = "") {
  string1 = string1.toUpperCase();
  string2 = string2.toUpperCase();
  return string1 < string2 ? -1 : string1 > string2 ? 1 : 0;
}

const getFormattedDateStringFromUnixTime = time => {
  const date = new Date(time);
  const day = date.getDate();
  const month = date.getMonth() + 1;
  return `${date.getFullYear()}-${month < 10 ? "0" : ""}${month}-${
    day < 10 ? "0" : ""
  }${day}`;
};

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

export {
  axios as http,
  monthNames,
  orderAlphabetically,
  getFormattedDateStringFromUnixTime
};
