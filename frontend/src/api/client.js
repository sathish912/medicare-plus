import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("mcp_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("mcp_token");
      localStorage.removeItem("mcp_user");
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    
    // Normalize FastAPI 422 validation error arrays to prevent React rendering crashes in toast
    if (error.response?.data?.detail && Array.isArray(error.response.data.detail)) {
      error.response.data.detail = error.response.data.detail.map(err => `${err.loc.join('.')}: ${err.msg}`).join(', ');
    }
    return Promise.reject(error);
  }
);

export default api;
