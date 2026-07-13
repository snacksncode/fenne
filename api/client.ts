import * as SecureStore from 'expo-secure-store';
import { TOKEN_KEY } from '@/contexts/session';
import { authSignal } from '@/api/auth-event';

export const getBaseUrl = () => `127.0.0.1:3069`;
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

export type V2SuccessResponse<T> = { status: 'success'; data: T; meta?: unknown };
type V2Response<T> = V2SuccessResponse<T> | { status: 'error'; errors: unknown };

const abandonUnauthorizedRequest = () => new Promise<never>(() => {});

const handleUnauthorizedRequest = () => {
  authSignal.handleUnauthorized();
  return abandonUnauthorizedRequest();
};

const requestEnvelope = async <T>({ path, ...requestDetails }: RequestProps): Promise<V2SuccessResponse<T>> => {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const url = `http://${getBaseUrl()}/v2${path}`;
  const options: RequestInit = {
    method: requestDetails.method,
    headers,
    ...('body' in requestDetails && { body: JSON.stringify(requestDetails.body) }),
  };

  const res = await fetch(url, options);
  if (res.status === 401 && SecureStore.getItem(TOKEN_KEY) != null) {
    return handleUnauthorizedRequest();
  }
  if (!res.ok) {
    const json = await res.json();
    throw new APIError(json?.errors ?? json);
  }
  if (res.status === 204) return { status: 'success', data: {} as T }; // stupid patch
  const json = (await res.json()) as V2Response<T>;
  if (json.status === 'error') throw new APIError(json.errors);
  return json;
};

const request = async <T>(props: RequestProps): Promise<T> => {
  const json = await requestEnvelope<T>(props);
  return json.data;
};

export const client = {
  get: <T = any>(path: string) => request<T>({ method: 'GET', path }),
  post: <T = any>(path: string, body?: any) => request<T>({ method: 'POST', path, body }),
  patch: <T = any>(path: string, body?: any) => request<T>({ method: 'PATCH', path, body }),
  put: <T = any>(path: string, body?: any) => request<T>({ method: 'PUT', path, body }),
  delete: <T = any>(path: string) => request<T>({ method: 'DELETE', path }),
  deleteWithMeta: <T = any>(path: string) => requestEnvelope<T>({ method: 'DELETE', path }),
};
