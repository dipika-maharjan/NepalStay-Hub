import axios from "axios";

const backendUrl = (
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5051"
).replace(/\/api\/?$/, "");

const api = axios.create({
  baseURL: backendUrl,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

const normalizeApiPath = (url: string) => {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/api")) return url;
  return `/api${url.startsWith("/") ? url : `/${url}`}`;
};

// Add a request interceptor to attach the Authorization header
api.interceptors.request.use((config) => {
  if (config.url) {
    config.url = normalizeApiPath(config.url);
  }
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token && token !== "undefined") {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return config;
});

// Auto-redirect on 401
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
