import axios, { AxiosError, AxiosInstance } from 'axios';
import { getToken, clearToken } from './storage';

export const BASE_URL = 'https://apps.deodap.info/hrms-app/api';

/** Laravel-style response envelope: { status, message, data }. */
export interface ApiEnvelope<T = any> {
  status?: boolean | string | number;
  message?: string;
  data?: T;
}

let onUnauthorized: (() => void) | null = null;

/** Allow the auth layer to register a logout-on-401 callback. */
export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn;
}

export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  headers: { Accept: 'application/json' },
});

api.interceptors.request.use(async config => {
  const token = await getToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  response => response,
  async (error: AxiosError<ApiEnvelope>) => {
    if (error.response?.status === 401) {
      await clearToken();
      onUnauthorized?.();
    }
    return Promise.reject(error);
  },
);

/** Normalize any error into a user-friendly message. */
export function getErrorMessage(error: unknown): string {
  const err = error as AxiosError<ApiEnvelope & { errors?: Record<string, string[]> }>;
  if (err?.response?.data) {
    const data = err.response.data;
    if (data.message) return String(data.message);
    if (data.errors) {
      const first = Object.values(data.errors)[0];
      if (Array.isArray(first) && first[0]) return first[0];
    }
  }
  if (err?.message === 'Network Error') {
    return 'Cannot reach the server. Check your internet connection.';
  }
  if (err?.code === 'ECONNABORTED') return 'Request timed out. Please try again.';
  return err?.message || 'Something went wrong. Please try again.';
}

/** Unwrap the `data` field from the envelope, falling back to the raw body. */
export function unwrap<T = any>(body: ApiEnvelope<T> | T): T {
  if (body && typeof body === 'object' && 'data' in (body as object)) {
    return (body as ApiEnvelope<T>).data as T;
  }
  return body as T;
}

export default api;
