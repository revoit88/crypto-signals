import axios from "axios";

const http = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  headers: {
    Authorization: `Bearer ${process.env.REACT_APP_API_TOKEN}`
  }
});

export default http;
