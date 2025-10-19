import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import cable from '../cable';

export const useInvalidationChannel = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    console.log('effect run');
    const subscription = cable.subscriptions.create(
      { channel: 'InvalidationChannel' },
      {
        received: (data: { action: string; query_key: any[] }) => {
          if (data.action === 'invalidate' && Array.isArray(data.query_key)) {
            console.log('Received invalidation for queryKey:', data.query_key);
            queryClient.invalidateQueries({ queryKey: data.query_key });
          } else {
            console.warn('Unknown or malformed invalidation message:', data);
          }
        },
        connected: () => {
          console.log('Action Cable connected to InvalidationChannel!');
        },
        disconnected: () => {
          console.log('Action Cable disconnected from InvalidationChannel.');
        },
        rejected: () => {
          console.log(
            'Action Cable connection rejected for InvalidationChannel.'
          );
        },
      }
    );

    return () => {
      console.log('Unsubscribing from InvalidationChannel');
      subscription.unsubscribe();
    };
  }, [queryClient]);
};
