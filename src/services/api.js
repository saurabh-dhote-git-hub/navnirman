import { readToken } from "./authStorage";
import { Capacitor } from "@capacitor/core";

let accessToken = null;
export function setAccessToken(token) { accessToken = token || null; }

// Browser on the PC uses localhost. Android emulator uses 10.0.2.2 to reach
// the host PC. For a physical phone, set VITE_API_BASE_URL to the PC Wi-Fi IP.
const DEFAULT_API_BASE_URL = Capacitor.isNativePlatform()
  ? "http://10.0.2.2:8080/api"
  : "http://localhost:8080/api";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;

async function apiRequest(endpoint, options = {}) {
  const token = accessToken || await readToken();
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(detail || `API request failed (${response.status})`);
  }

  if (response.status === 204) return null;
  return response.json();
}

export const api = {
  health: () => apiRequest("/health"),
  getCategories: () => apiRequest("/categories"),
  getVideos: () => apiRequest("/videos"),
  getVideo: (id) => apiRequest(`/videos/${id}`),
  register: (payload) => apiRequest("/auth/register", { method: "POST", body: JSON.stringify(payload) }),
  login: (payload) => apiRequest("/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  me: () => apiRequest("/auth/me"),
};


// Resolves backend-provided stream paths without changing their route.
export function getStreamUrl(streamUrl, videoId) {
  const fallbackPath = `/videos/${videoId}/stream`;
  const value = streamUrl || fallbackPath;

  if (/^https?:\/\//i.test(value)) return value;

  const apiBase = API_BASE_URL.replace(/\/+$/, "");
  if (value.startsWith("/api/")) {
    const origin = new URL(apiBase).origin;
    return `${origin}${value}`;
  }
  if (value.startsWith("/")) {
    const apiPrefix = new URL(apiBase).pathname.replace(/\/+$/, "");
    return `${new URL(apiBase).origin}${apiPrefix}${value}`;
  }
  return `${apiBase}/${value.replace(/^\/+/, "")}`;
}
