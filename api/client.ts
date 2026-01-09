import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { TOKEN_KEY } from '@/contexts/session';

export const getBaseUrl = () => {
  const host = Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1';
  return `${host}:3000`;
};

export class APIError extends Error {
  data: unknown;
  constructor(data: unknown) {
    super();
    this.data = data;
  }
}

type RequestProps = ({ method: 'GET' | 'DELETE' } | { method: 'POST' | 'PATCH' | 'PUT'; body: unknown }) & {
  path: string;
};

const request = async <T>({ path, ...requestDetails }: RequestProps): Promise<T> => {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const url = `http://${getBaseUrl()}${path}`;
  const options: RequestInit = {
    method: requestDetails.method,
    headers,
    ...('body' in requestDetails && { body: JSON.stringify(requestDetails.body) }),
  };

  const res = await fetch(url, options);
  if (!res.ok) {
    const json = await res.json();
    throw new APIError(json);
  }
  if (res.status === 204) return {} as T; // stupid patch
  return res.json();
};

export const client = {
  get: <T = any>(path: string) => request<T>({ method: 'GET', path }),
  post: <T = any>(path: string, body?: any) => request<T>({ method: 'POST', path, body }),
  patch: <T = any>(path: string, body?: any) => request<T>({ method: 'PATCH', path, body }),
  put: <T = any>(path: string, body?: any) => request<T>({ method: 'PUT', path, body }),
  delete: <T = any>(path: string) => request<T>({ method: 'DELETE', path }),
};
