import { refreshFamilyData, FamilyChange } from '@/lib/family-data';
import { useEffect } from 'react';
import { getBaseUrl } from '@/api/client';
import { createConsumer } from '@rails/actioncable';
import { useQueryClient } from '@tanstack/react-query';
import { isPlainObject } from 'remeda';
import { useCurrentUser } from '@/api/auth';
import { useSession } from '@/contexts/session';
import { atom, useSetAtom } from 'jotai';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';
export const connectionStatusAtom = atom<ConnectionStatus>('disconnected');

if (typeof globalThis.addEventListener !== 'function') globalThis.addEventListener = () => {};
if (typeof globalThis.removeEventListener !== 'function') globalThis.removeEventListener = () => {};

export const useInvalidationChannel = () => {
  const { data: user } = useCurrentUser();
  const { token } = useSession();
  const queryClient = useQueryClient();
  const setConnectionStatus = useSetAtom(connectionStatusAtom);

  useEffect(() => {
    if (!token) return setConnectionStatus('disconnected');

    const websocketBaseUrl = getBaseUrl().replace(/^http/, 'ws');
    const cable = createConsumer(`${websocketBaseUrl}/v2/cable?token=${encodeURIComponent(token)}`);
    setConnectionStatus('connecting');

    cable.subscriptions.create(
      { channel: 'InvalidationChannel' },
      {
        received: (data: FamilyChange) => {
          if (!isPlainObject(data) || !('resource' in data)) return;
          void refreshFamilyData(queryClient, data);
        },
        connected: () => {
          setConnectionStatus('connected');
          void refreshFamilyData(queryClient, { resource: 'reconnect' });
        },
        disconnected: () => {
          setConnectionStatus('disconnected');
        },
        rejected: () => {
          setConnectionStatus('disconnected');
        },
      }
    );

    return () => cable.disconnect();
  }, [token, user?.family?.id, queryClient, setConnectionStatus]);
};
