import { queryClient } from '@/query-client';
import type { MutationFunctionContext } from '@tanstack/react-query';
import { refreshFamilyData } from '@/lib/family-data';
import { client } from '@/api/client';
import { PantryEntryDTO } from '@/api/types';
import { queryKeys } from '@/api/query-keys';
import { useMutation, useQuery, queryOptions } from '@tanstack/react-query';

const refreshPantry = (
  _data: unknown, _error: Error | null, _variables: unknown, _result: unknown,
  { client }: MutationFunctionContext,
) => refreshFamilyData(client, { resource: 'pantry_entries' });

export const pantryRequests = {
  getAll: () => {
    return client.get<PantryEntryDTO[]>('/pantry_entries');
  },
  add: (data: {
    product_id: string;
    quantity_remaining?: number | null;
    last_acquired?: string | null;
  }) => {
    return client.post<PantryEntryDTO>('/pantry_entries', data);
  },
  edit: (
    data: Pick<PantryEntryDTO, 'id'> &
      Partial<Pick<PantryEntryDTO, 'quantity_remaining' | 'last_acquired'>>
  ) => {
    const { id, ...entryData } = data;
    return client.patch<PantryEntryDTO>(`/pantry_entries/${id}`, entryData);
  },
  delete: (data: { id: string }) => {
    return client.delete(`/pantry_entries/${data.id}`);
  },
};

export const pantryQuery = queryOptions({
  queryKey: queryKeys.pantry.all(),
  queryFn: pantryRequests.getAll,
  staleTime: Infinity,
});

export const usePantry = () => {
  return useQuery(pantryQuery);
};

export const addPantryEntryMutation = {
  meta: { persist: true },
  mutationKey: ['addPantryEntry'],
  mutationFn: pantryRequests.add,
  onSettled: refreshPantry,
};

queryClient.setMutationDefaults(addPantryEntryMutation.mutationKey, addPantryEntryMutation);

export const useAddPantryEntry = () => useMutation(addPantryEntryMutation);

export const editPantryEntryMutation = {
  meta: { persist: true },
  mutationKey: ['editPantryEntry'],
  mutationFn: pantryRequests.edit,
  onSettled: refreshPantry,
};

queryClient.setMutationDefaults(editPantryEntryMutation.mutationKey, editPantryEntryMutation);

export const useEditPantryEntry = () => useMutation(editPantryEntryMutation);

export const deletePantryEntryMutation = {
  meta: { persist: true },
  mutationKey: ['deletePantryEntry'],
  mutationFn: pantryRequests.delete,
  onSettled: refreshPantry,
};

queryClient.setMutationDefaults(deletePantryEntryMutation.mutationKey, deletePantryEntryMutation);

export const useDeletePantryEntry = () => useMutation(deletePantryEntryMutation);
