import AsyncStorage from '@react-native-async-storage/async-storage';
import { atom, createStore, useAtomValue } from 'jotai';
import { useEffect } from 'react';

export const BACKEND_URL_KEY = 'backend-base-url';
/** Fallback for installs upgraded before the backend URL became configurable. */
export const DEFAULT_BACKEND_BASE_URL = 'https://api.fenneplanner.com';

export type BackendUrlParseResult = { ok: true; url: string } | { ok: false; message: string };

const SCHEME_PATTERN = /^([a-z][a-z\d+\-.]*):\/\//i;
const HOST_PATTERN = /^[a-z\d](?:[a-z\d-]*[a-z\d])?(?:\.[a-z\d](?:[a-z\d-]*[a-z\d])?)*$/i;

const invalid = (message: string): BackendUrlParseResult => ({ ok: false, message });

/** Normalizes what the user typed into `<scheme>://<host>[:<port>]`, dropping any path. */
export const parseBackendUrl = (input: string): BackendUrlParseResult => {
  const trimmed = input.trim();
  if (!trimmed) return invalid('Enter the backend URL');

  const schemeMatch = SCHEME_PATTERN.exec(trimmed);
  const scheme = (schemeMatch?.[1] ?? 'http').toLowerCase();
  if (scheme !== 'http' && scheme !== 'https') return invalid('Use an http:// or https:// address');

  const authority = (schemeMatch ? trimmed.slice(schemeMatch[0].length) : trimmed).split(/[/?#]/)[0];
  if (!authority) return invalid('Enter an address like http://192.168.1.10:4000');

  // shortcut: no IPv6 literals, split the port at the last colon; add bracket parsing if a dev needs [::1]:4000.
  const separator = authority.lastIndexOf(':');
  const host = (separator === -1 ? authority : authority.slice(0, separator)).toLowerCase();
  const port = separator === -1 ? '' : authority.slice(separator + 1);

  if (!HOST_PATTERN.test(host)) return invalid('Enter a valid hostname or IP address');
  if (!port) {
    return scheme === 'https' ? { ok: true, url: `https://${host}` }
      : invalid('Include the port, for example http://192.168.1.10:4000');
  }
  if (!/^\d{1,5}$/.test(port) || Number(port) < 1 || Number(port) > 65535) return invalid('Enter a valid port number');

  const isImplicit = (scheme === 'http' && port === '80') || (scheme === 'https' && port === '443');
  return { ok: true, url: isImplicit ? `${scheme}://${host}` : `${scheme}://${host}:${port}` };
};

type BackendUrlState = { url: string | null; isLoading: boolean };

export const backendUrlStore = createStore();
const backendUrlAtom = atom<BackendUrlState>({ url: null, isLoading: true });

export const getConfiguredBackendUrl = () => backendUrlStore.get(backendUrlAtom).url;

let hydration: Promise<void> | undefined;

export function hydrateBackendUrl() {
  if (hydration) return hydration;
  hydration = (async () => {
    try {
      const stored = await AsyncStorage.getItem(BACKEND_URL_KEY);
      const parsed = stored ? parseBackendUrl(stored) : null;
      // A corrupted stored value must not silently point the app at another backend.
      backendUrlStore.set(backendUrlAtom, { url: parsed?.ok ? parsed.url : null, isLoading: false });
    } catch {
      backendUrlStore.set(backendUrlAtom, { url: null, isLoading: false });
    }
  })();
  return hydration;
}

export async function setBackendUrl(input: string) {
  const parsed = parseBackendUrl(input);
  if (!parsed.ok) throw new Error(parsed.message);
  await hydrateBackendUrl();
  backendUrlStore.set(backendUrlAtom, { url: parsed.url, isLoading: false });
  await AsyncStorage.setItem(BACKEND_URL_KEY, parsed.url);
  return parsed.url;
}

export async function resetBackendUrl() {
  await hydrateBackendUrl();
  backendUrlStore.set(backendUrlAtom, { url: null, isLoading: false });
  await AsyncStorage.removeItem(BACKEND_URL_KEY);
}

export function useBackendUrl() {
  useEffect(() => { void hydrateBackendUrl(); }, []);
  const { url, isLoading } = useAtomValue(backendUrlAtom, { store: backendUrlStore });
  return { baseUrl: url ?? DEFAULT_BACKEND_BASE_URL, configuredUrl: url, isConfigured: !!url, isLoading };
}
