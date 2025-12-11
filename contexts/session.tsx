import { useCurrentUser } from '@/api/auth';
import { useMount } from '@/hooks/use-mount';
import * as SecureStore from 'expo-secure-store';
import { createContext, ReactNode, use, useState } from 'react';
import { doNothing } from 'remeda';

export const TOKEN_KEY = 'ee3ad6fddfadb72';

const SessionContext = createContext<{
  token: string | null;
  isLoading: boolean;
  setSessionToken: (token: string) => void;
  removeSessionToken: () => void;
} | null>({
  token: null,
  isLoading: true,
  setSessionToken: doNothing,
  removeSessionToken: doNothing,
});

export const useSession = () => {
  const session = use(SessionContext);
  if (!session) throw new Error('useSession must be wrapped in a <SessionProvider />');
  return session;
};

export const SessionProvider = (props: { children: ReactNode }) => {
  const [session, setSession] = useState<{ token: string | null } | null>(null);

  useMount(() => void boot());

  const boot = async () => {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    setSession({ token });
  };

  const setSessionToken = (token: string) => {
    SecureStore.setItemAsync(TOKEN_KEY, token).then(() => setSession({ token }));
  };

  const removeSessionToken = () => {
    SecureStore.deleteItemAsync(TOKEN_KEY).then(() => setSession({ token: null }));
  };

  return (
    <SessionContext.Provider
      value={{
        isLoading: session == null,
        token: session?.token ?? null,
        setSessionToken,
        removeSessionToken,
      }}
    >
      {props.children}
    </SessionContext.Provider>
  );
};
