import { api } from '@/api';
import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useOptimisticUpdate } from '@/api/optimistic';
import { queryClient } from '@/query-client';
import { queryKeys } from '@/api/query-keys';

export const groceriesOptions = queryOptions({
  queryKey: queryKeys.groceries.all(),
  queryFn: api.groceries.getAll,
  staleTime: Infinity,
});

export const useGroceries = () => {
  return useQuery(groceriesOptions);
};

export const groceryPreviewOptions = (start: string, end: string) =>
  queryOptions({
    queryKey: queryKeys.groceries.preview(start, end),
    queryFn: () => api.groceries.preview({ start, end }),
  });

export const useGroceryPreview = ({ start, end, enabled }: { start?: string; end?: string; enabled?: boolean }) => {
  return useQuery({
    ...groceryPreviewOptions(start ?? '', end ?? ''),
    enabled: enabled !== false && start != null && end != null,
  });
};

queryClient.setMutationDefaults(['editGroceryItem'], { mutationFn: api.groceries.edit });
export const useEditGroceryItem = () => {
  const { update, revert } = useOptimisticUpdate();
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['editGroceryItem'],
    mutationFn: api.groceries.edit,
    onMutate: async (newItemData) => {
      const { previousData } = await update({
        queryKey: groceriesOptions.queryKey,
        updateFn: (state) => {
          const item = state.find((i) => i.id === newItemData.id);
          if (item) Object.assign(item, newItemData);
        },
      });
      return { previousData, queryKey: groceriesOptions.queryKey };
    },
    onError: (_err, _vars, context) => {
      if (context) revert(context);
    },
    onSettled: () => {
      queryClient.invalidateQueries(groceriesOptions);
      queryClient.invalidateQueries({ queryKey: queryKeys.groceries.previews() });
    },
  });
};

queryClient.setMutationDefaults(['addGroceryItem'], { mutationFn: api.groceries.add });
export const useAddGroceryItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['addGroceryItem'],
    mutationFn: api.groceries.add,
    onSettled: () => {
      queryClient.invalidateQueries(groceriesOptions);
      queryClient.invalidateQueries({ queryKey: queryKeys.groceries.previews() });
    },
  });
};

export const useAddRecipeToGroceries = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.groceries.addFromRecipe,
    onSuccess: () => {
      queryClient.invalidateQueries(groceriesOptions);
      queryClient.invalidateQueries({ queryKey: queryKeys.groceries.previews() });
    },
  });
};

queryClient.setMutationDefaults(['generateGroceryItems'], { mutationFn: api.groceries.generate });
export const useGenerateGroceryItems = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['generateGroceryItems'],
    mutationFn: api.groceries.generate,
    onSettled: () => {
      queryClient.invalidateQueries(groceriesOptions);
      queryClient.invalidateQueries({ queryKey: queryKeys.groceries.previews() });
    },
  });
};

queryClient.setMutationDefaults(['deleteGroceryItem'], { mutationFn: api.groceries.delete });
export const useDeleteGroceryItem = () => {
  const { update, revert } = useOptimisticUpdate();
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['deleteGroceryItem'],
    mutationFn: api.groceries.delete,
    onMutate: async ({ id }) => {
      const { previousData } = await update({
        queryKey: groceriesOptions.queryKey,
        updateFn: (state) => state.filter((i) => i.id !== id),
      });
      return { previousData, queryKey: groceriesOptions.queryKey };
    },
    onError: (_err, _vars, context) => {
      if (context) revert(context);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groceries.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.groceries.previews() });
    },
  });
};

queryClient.setMutationDefaults(['checkout'], { mutationFn: api.groceries.checkout });
export const useGroceryCheckout = () => {
  const { update, revert } = useOptimisticUpdate();
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['checkout'],
    mutationFn: api.groceries.checkout,
    onMutate: async () => {
      const { previousData } = await update({
        queryKey: groceriesOptions.queryKey,
        updateFn: (state) => state.filter((item) => item.status !== 'completed'),
      });
      return { previousData, queryKey: groceriesOptions.queryKey };
    },
    onError: (_err, _vars, context) => {
      if (context) revert(context);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groceries.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.groceries.previews() });
    },
  });
};
