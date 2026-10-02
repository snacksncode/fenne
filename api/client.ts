import { getSession, hydrateSession, signOut } from '@/lib/session';

export const getBaseUrl = () => (__DEV__ ? 'http://127.0.0.1:4000' : 'https://api.fenneplanner.com');
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

export class SessionChangedError extends Error {
  constructor() { super('The session changed while the request was running'); this.name = 'SessionChangedError'; }
}

export class UnauthorizedError extends APIError {
  constructor() { super({ base: ['Your session expired. Please sign in again.'] }); this.name = 'UnauthorizedError'; }
}

const requestEnvelope = async <T>({ path, ...requestDetails }: RequestProps): Promise<V2SuccessResponse<T>> => {
  await hydrateSession();
  const { token, revision } = getSession();

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const url = `${getBaseUrl()}/v2${path}`;
  const options: RequestInit = {
    method: requestDetails.method,
    headers,
    ...('body' in requestDetails && { body: JSON.stringify(requestDetails.body) }),
  };

  const res = await fetch(url, options);
  if (getSession().revision !== revision) throw new SessionChangedError();
  if (res.status === 401 && token) {
    await signOut(token).catch(() => {});
    throw new UnauthorizedError();
  }
  if (!res.ok) {
    const json = await res.json();
    if (getSession().revision !== revision) throw new SessionChangedError();
    throw new APIError(json?.errors ?? json);
  }
  if (res.status === 204) return { status: 'success', data: {} as T }; // A successful DELETE may have no response body.
  const json = (await res.json()) as V2Response<T>;
  if (getSession().revision !== revision) throw new SessionChangedError();
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
