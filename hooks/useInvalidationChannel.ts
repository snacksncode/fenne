import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { getBaseUrl } from '@/api';
import { createConsumer, Consumer } from '@rails/actioncable';
import { useQueryClient } from '@tanstack/react-query';
import { isPlainObject } from 'remeda';
import { getISOWeekString } from '@/date-tools';
import { recipesOptions } from '@/api/recipes';
import { scheduleOptions } from '@/api/schedules';
import { groceriesOptions } from '@/api/groceries';
import { invitationsOptions } from '@/api/invitations';
import { currentUserOptions, useCurrentUser } from '@/api/auth';
import { useSession } from '@/contexts/session';
import { atom, useSetAtom } from 'jotai';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';
export const connectionStatusAtom = atom<ConnectionStatus>('disconnected');

type Data =
  | { resource: 'schedules'; data: { dates: string[] } }
  | { resource: 'recipes' }
  | { resource: 'grocery_items' }
  | { resource: 'invitations' }
  | { resource: 'family_members' };

global.addEventListener = () => {};
global.removeEventListener = () => {};

export const useInvalidationChannel = () => {
  const { data: user } = useCurrentUser();
  const { token } = useSession();
  const queryClient = useQueryClient();
  const setConnectionStatus = useSetAtom(connectionStatusAtom);

  useEffect(() => {
    if (!token) return setConnectionStatus('disconnected');

    const cable = createConsumer(`ws://${getBaseUrl()}/cable?token=${token}`);
    setConnectionStatus('connecting');

    cable.subscriptions.create(
      { channel: 'InvalidationChannel' },
      {
        received: (data: Data) => {
          if (!isPlainObject(data)) return;

          if (data.resource === 'schedules') {
            const weekKeys = data.data.dates.map(getISOWeekString);
            weekKeys.forEach((weekKey) => {
              queryClient.invalidateQueries(scheduleOptions(weekKey));
            });
          }

          if (data.resource === 'recipes') {
            queryClient.invalidateQueries(recipesOptions);
          }

          if (data.resource === 'grocery_items') {
            queryClient.invalidateQueries(groceriesOptions);
          }

          if (data.resource === 'invitations') {
            queryClient.invalidateQueries(invitationsOptions);
          }

          if (data.resource === 'family_members') {
            queryClient.invalidateQueries(currentUserOptions);
          }
        },
        connected: () => {
          setConnectionStatus('connected');
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
  }, [token, user?.family.id]);
};
