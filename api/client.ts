import * as SecureStore from 'expo-secure-store';
import { TOKEN_KEY } from '@/contexts/session';
import { authSignal } from '@/api/auth-event';

export const getBaseUrl = () => `api.fenneplanner.com`;
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

  const url = `https://${getBaseUrl()}${path}`;
  const options: RequestInit = {
    method: requestDetails.method,
    headers,
    ...('body' in requestDetails && { body: JSON.stringify(requestDetails.body) }),
  };

  const res = await fetch(url, options);
  if (res.status === 401 && SecureStore.getItem(TOKEN_KEY) != null) {
    authSignal.handleUnauthorized();
    return {} as T;
  }
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
