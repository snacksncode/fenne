import { api } from '@/api';
import { groceriesOptions } from '@/api/groceries';
import { queryKeys } from '@/api/query-keys';
import { useMutation, useQuery, useQueryClient, queryOptions } from '@tanstack/react-query';

export const pantryOptions = queryOptions({
  queryKey: queryKeys.pantry.all(),
  queryFn: api.pantry.getAll,
  staleTime: Infinity,
});

export const usePantry = () => {
  return useQuery(pantryOptions);
};

export const useAddPantryEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['addPantryEntry'],
    mutationFn: api.pantry.add,
    onSettled: () => {
      queryClient.invalidateQueries(pantryOptions);
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.groceries.previews() });
      queryClient.invalidateQueries(groceriesOptions);
    },
  });
};

export const useEditPantryEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['editPantryEntry'],
    mutationFn: api.pantry.edit,
    onSettled: () => {
      queryClient.invalidateQueries(pantryOptions);
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.groceries.previews() });
      queryClient.invalidateQueries(groceriesOptions);
    },
  });
};

export const useDeletePantryEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['deletePantryEntry'],
    mutationFn: api.pantry.delete,
    onSettled: () => {
      queryClient.invalidateQueries(pantryOptions);
      queryClient.invalidateQueries({ queryKey: queryKeys.groceries.previews() });
      queryClient.invalidateQueries(groceriesOptions);
    },
  });
};
