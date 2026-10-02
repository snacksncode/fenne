import { refreshFamilyData, FamilyChange } from '@/lib/family-data';
import { useEffect } from 'react';
import { getBaseUrl } from '@/api/client';
import { createConsumer } from '@rails/actioncable';
import { useQueryClient } from '@tanstack/react-query';
import { isPlainObject } from 'remeda';
import { useCurrentUser } from '@/api/auth';
import { useSession } from '@/contexts/session';

if (typeof globalThis.addEventListener !== 'function') globalThis.addEventListener = () => {};
if (typeof globalThis.removeEventListener !== 'function') globalThis.removeEventListener = () => {};

export const useInvalidationChannel = () => {
  const { data: user } = useCurrentUser();
  const { token } = useSession();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!token) return;

    const websocketBaseUrl = getBaseUrl().replace(/^http/, 'ws');
    const cable = createConsumer(`${websocketBaseUrl}/v2/cable?token=${encodeURIComponent(token)}`);

    cable.subscriptions.create(
      { channel: 'InvalidationChannel' },
      {
        received: (data: FamilyChange) => {
          if (!isPlainObject(data) || !('resource' in data)) return;
          void refreshFamilyData(queryClient, data);
        },
        connected: () => {
          void refreshFamilyData(queryClient, { resource: 'reconnect' });
        },
      }
    );

    return () => cable.disconnect();
  }, [token, user?.family?.id, queryClient]);
};
