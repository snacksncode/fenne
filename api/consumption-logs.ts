import { queryClient } from '@/query-client';
import type { MutationFunctionContext } from '@tanstack/react-query';
import { refreshFamilyData } from '@/lib/family-data';
import { client } from '@/api/client';
import { ConsumptionLogDTO, MealType } from '@/api/types';
import { queryKeys } from '@/api/query-keys';
import { queryOptions, useMutation, useQuery } from '@tanstack/react-query';

const refreshConsumptionLogs = (
  _data: unknown, _error: Error | null, _variables: unknown, _result: unknown,
  { client }: MutationFunctionContext,
) => refreshFamilyData(client, { resource: 'consumption_logs' });

export const consumptionLogsRequests = {
  getAll: () => {
    return client.get<ConsumptionLogDTO[]>('/consumption_logs');
  },
  add: (data: { recipe_id: string; meal_type: MealType; schedule_date: string }) => {
    return client.post<ConsumptionLogDTO>('/consumption_logs', data);
  },
  delete: (data: { id: string }) => {
    return client.deleteWithMeta<null>(`/consumption_logs/${data.id}`);
  },
};

export const consumptionLogsQuery = queryOptions({
  queryKey: queryKeys.consumptionLogs.all(),
  queryFn: consumptionLogsRequests.getAll,
  staleTime: Infinity,
});

export const useConsumptionLogs = () => {
  return useQuery(consumptionLogsQuery);
};

export const addConsumptionLogMutation = {
  meta: { persist: true },
  mutationKey: ['addConsumptionLog'],
  mutationFn: consumptionLogsRequests.add,
  onSettled: refreshConsumptionLogs,
};

queryClient.setMutationDefaults(addConsumptionLogMutation.mutationKey, addConsumptionLogMutation);

export const useAddConsumptionLog = () => useMutation(addConsumptionLogMutation);

export const deleteConsumptionLogMutation = {
  meta: { persist: true },
  mutationKey: ['deleteConsumptionLog'],
  mutationFn: consumptionLogsRequests.delete,
  onSettled: refreshConsumptionLogs,
};

queryClient.setMutationDefaults(deleteConsumptionLogMutation.mutationKey, deleteConsumptionLogMutation);

export const useDeleteConsumptionLog = () => useMutation(deleteConsumptionLogMutation);
