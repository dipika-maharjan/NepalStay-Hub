import axios from "axios";
import { getAuthToken } from "../cookie";

const backendUrl = (
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5051"
).replace(/\/api\/?$/, "");

const api = axios.create({
  baseURL: backendUrl,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(async (config) => {
  const token = await getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default api;
