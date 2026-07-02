import { api } from '@/api';
import { pantryOptions } from '@/api/pantry';
import { queryKeys } from '@/api/query-keys';
import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const consumptionLogsOptions = queryOptions({
  queryKey: queryKeys.consumptionLogs.all(),
  queryFn: api.consumptionLogs.getAll,
  staleTime: Infinity,
});

export const useConsumptionLogs = () => {
  return useQuery(consumptionLogsOptions);
};

export const useAddConsumptionLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['addConsumptionLog'],
    mutationFn: api.consumptionLogs.add,
    onSettled: () => {
      queryClient.invalidateQueries(consumptionLogsOptions);
      queryClient.invalidateQueries(pantryOptions);
      queryClient.invalidateQueries({ queryKey: queryKeys.groceries.previews() });
    },
  });
};

export const useDeleteConsumptionLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['deleteConsumptionLog'],
    mutationFn: api.consumptionLogs.delete,
    onSettled: () => {
      queryClient.invalidateQueries(consumptionLogsOptions);
      queryClient.invalidateQueries(pantryOptions);
      queryClient.invalidateQueries({ queryKey: queryKeys.groceries.previews() });
    },
  });
};
