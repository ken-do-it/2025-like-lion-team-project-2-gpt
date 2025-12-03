import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8001/api";
const DEV_USER_ID = import.meta.env.VITE_DEV_USER_ID;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10_000,
});

// Dev-only auth header fallback if provided
if (DEV_USER_ID) {
  apiClient.defaults.headers.common["X-User-Id"] = DEV_USER_ID;
}

export default apiClient;
