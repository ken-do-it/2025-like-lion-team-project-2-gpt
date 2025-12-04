import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8001/api";
const DEV_USER_ID = import.meta.env.VITE_DEV_USER_ID;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10_000,
});

// Dev-only auth header fallback (default user 1 if not provided)
apiClient.defaults.headers.common["X-User-Id"] = DEV_USER_ID ?? "1";

// One-time connectivity check on startup
(async () => {
  try {
    await apiClient.get("/health");
    console.info(`[${API_BASE_URL}] 연결 성공`);
  } catch (error) {
    console.warn(`[${API_BASE_URL}] 연결 실패`, error);
  }
})();

export default apiClient;
