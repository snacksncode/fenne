import { useMount } from '@/hooks/use-mount';
import * as SecureStore from 'expo-secure-store';
import { createContext, ReactNode, use, useState } from 'react';

export const TOKEN_KEY = 'ee3ad6fddfadb72';
export const HAS_LOGGED_IN_KEY = 'ff4f6ac0f731f';

const SessionContext = createContext<{
  token: string | null;
  isLoading: boolean;
  hasEverLoggedIn: boolean;
  setSessionToken: (token: string) => void;
  removeSessionToken: () => void;
} | null>(null);

export const useSession = () => {
  const session = use(SessionContext);
  if (!session) throw new Error('useSession must be wrapped in a <SessionProvider />');
  return session;
};

export const SessionProvider = (props: { children: ReactNode }) => {
  const [session, setSession] = useState<{ token: string | null } | null>(null);
  const [hasEverLoggedIn, setHasEverLoggedIn] = useState<boolean>(false);

  useMount(() => void boot());

  const boot = async () => {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    const hasLoggedIn = await SecureStore.getItemAsync(HAS_LOGGED_IN_KEY);
    setSession({ token });
    setHasEverLoggedIn(!!hasLoggedIn);
  };

  const setSessionToken = (token: string) => {
    SecureStore.setItemAsync(TOKEN_KEY, token).then(() => setSession({ token }));
    SecureStore.setItemAsync(HAS_LOGGED_IN_KEY, 'true').then(() => setHasEverLoggedIn(true));
  };

  const removeSessionToken = () => {
    SecureStore.deleteItemAsync(TOKEN_KEY).then(() => setSession({ token: null }));
  };

  return (
    <SessionContext.Provider
      value={{
        isLoading: session == null,
        hasEverLoggedIn,
        token: session?.token ?? null,
        setSessionToken,
        removeSessionToken,
      }}
    >
      {props.children}
    </SessionContext.Provider>
  );
};
