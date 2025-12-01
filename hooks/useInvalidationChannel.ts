import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import cable from '../cable';
import { isPlainObject } from 'remeda';
import { getISOWeekString } from '@/date-tools';
import { recipesOptions } from '@/api/recipes';
import { scheduleOptions } from '@/api/schedules';
import { groceriesOptions } from '@/api/groceries';

type Data =
  | {
      resource: 'schedules';
      data: { dates: string[] };
    }
  | {
      resource: 'recipes';
      data: null;
    }
  | {
      resource: 'grocery_items';
      data: null;
    };

export const useInvalidationChannel = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const subscription = cable.subscriptions.create(
      { channel: 'InvalidationChannel' },
      {
        received: (data: Data) => {
          if (!isPlainObject(data)) return;

          if (data.resource === 'schedules') {
            const weekKeys = data.data.dates.map(getISOWeekString);
            weekKeys.forEach((weekKey) => {
              queryClient.invalidateQueries({ queryKey: scheduleOptions(weekKey).queryKey });
            });
          }

          if (data.resource === 'recipes') {
            queryClient.invalidateQueries({ queryKey: recipesOptions.queryKey });
          }

          if (data.resource === 'grocery_items') {
            queryClient.invalidateQueries({ queryKey: groceriesOptions.queryKey });
          }
        },
        connected: () => {},
        disconnected: () => {},
        rejected: () => {},
      }
    );

    return () => void subscription.unsubscribe();
  }, [queryClient]);
};
