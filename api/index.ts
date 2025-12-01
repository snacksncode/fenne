import { Platform } from 'react-native';

export const TOKEN = '31f9584869f43d0181059804a4802c93c4887d6f2615b0520bceca4396c19ad0';

export const getBaseUrl = () => {
  const host = Platform.OS === 'android' ? '10.0.2.2' : '192.168.233.48';
  return `${host}:3000`;
};

const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${TOKEN}`,
};

const request = async <T>(method: string, path: string, body?: any): Promise<T> => {
  const url = `http://${getBaseUrl()}${path}`;
  const options: RequestInit = {
    method,
    headers,
    ...(body && { body: JSON.stringify(body) }),
  };

  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

export const api = {
  get: <T = any>(path: string) => request<T>('GET', path),
  post: <T = any>(path: string, data?: any) => request<T>('POST', path, data),
  patch: <T = any>(path: string, data?: any) => request<T>('PATCH', path, data),
  put: <T = any>(path: string, data?: any) => request<T>('PUT', path, data),
  delete: <T = any>(path: string) => request<T>('DELETE', path),
};
