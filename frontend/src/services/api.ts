/**
 * Axios instance pre-configured with:
 *  - Base URL from config
 *  - 10-second timeout (prevents requests hanging forever)
 *  - Request interceptor: attaches JWT from localStorage as Authorization header
 *  - Response interceptor: surfaces error details cleanly
 *
 * All backend API calls go through this instance.
 * Token is read synchronously from localStorage — no async, no race conditions.
 *
 * Note: we read localStorage directly (not via auth.ts getToken) to avoid a
 * circular import (auth.ts → api.ts → auth.ts). TOKEN_KEY constant is imported
 * from auth.ts as a simple string value — no circular dependency.
 */

import axios, { AxiosError } from "axios";
import { config } from "../config";
import { TOKEN_KEY } from "../constants";

const api = axios.create({
  baseURL: config.api.baseUrl,
  timeout: 60000, // 60 seconds — allows time for media uploads to Cloudinary
});

// Synchronously attach the JWT from localStorage before every request.
api.interceptors.request.use((requestConfig) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    // Using bracket notation for better compatibility with different Axios versions
    requestConfig.headers["Authorization"] = `Bearer ${token}`;
  }
  return requestConfig;
});

// Surface API errors with a readable message.
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ detail: string }>) => {
    if (error.code === "ECONNABORTED") {
      return Promise.reject(new Error("Request timed out. Is the backend running?"));
    }
    const detail = error.response?.data?.detail ?? error.message;
    const status = error.response?.status;
    console.error(`[api] ${error.config?.url} → ${status ?? "no status"}: ${detail}`);
    return Promise.reject(new Error(detail));
  }
);

export default api;
