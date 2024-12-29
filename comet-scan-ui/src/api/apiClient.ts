import axios from "axios";

const http = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  timeout: 60_000,
  transitional: {
    clarifyTimeoutError: true,
  }
})

export default http;