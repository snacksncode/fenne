import { useAtomValue } from 'jotai';
import { useEffect } from 'react';
import { hydrateSession, sessionAtom, sessionStore, setSessionToken, signOut } from '@/lib/session';

export { TOKEN_KEY, HAS_LOGGED_IN_KEY } from '@/lib/session';

export function useSession() {
  useEffect(() => { void hydrateSession(); }, []);
  const session = useAtomValue(sessionAtom, { store: sessionStore });
  return { ...session, setSessionToken, removeSessionToken: signOut };
}

