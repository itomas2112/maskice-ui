import axios from "axios";

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE, // automatically pulls from .env
});

console.log(process.env.NEXT_PUBLIC_API_BASE)

export default API;