import axios from "axios";
import { getAuthToken } from "../cookie";

const RAW_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.API_BASE_URL ||
  process.env.BACKEND_URL ||
  "http://localhost:5051";

const BASE_URL = RAW_BASE_URL.replace(/\/api\/?$/, "");

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

const normalizeApiPath = (url: string) => {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/api")) return url;
  return `/api${url.startsWith("/") ? url : `/${url}`}`;
};

axiosInstance.interceptors.request.use(
  async (config) => {
    if (config.url) {
      config.url = normalizeApiPath(config.url);
    }
    const token = await getAuthToken();
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    // Set Content-Type to JSON only if not already set and not FormData
    if (!config.headers["Content-Type"] && !(config.data instanceof FormData)) {
      config.headers["Content-Type"] = "application/json";
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default axiosInstance;
