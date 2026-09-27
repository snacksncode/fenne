import { api } from '@/api';
import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useOptimisticUpdate } from '@/api/optimistic';
import { queryClient } from '@/query-client';
import { queryKeys } from '@/api/query-keys';
import { GroceryItemDTO } from '@/api/types';

export type GroceryCheck = Pick<GroceryItemDTO, 'id' | 'status'> & { quantity?: number };

class GroceryCheckError extends Error {
  constructor(readonly failedIds: string[]) {
    super('Could not save some grocery checks');
  }
}

const editGroceryChecks = async (checks: GroceryCheck[]) => {
  const results = await Promise.allSettled(checks.map((check) => api.groceries.edit(check)));
  const failedIds = checks.filter((_, index) => results[index].status === 'rejected').map(({ id }) => id);
  if (failedIds.length) throw new GroceryCheckError(failedIds);
};

queryClient.setMutationDefaults(['editGroceryChecks'], { mutationFn: editGroceryChecks });

export const useEditGroceryChecks = () => {
  const client = useQueryClient();
  return useMutation({
    mutationKey: ['editGroceryChecks'],
    mutationFn: editGroceryChecks,
    onMutate: async (checks) => {
      await client.cancelQueries(groceriesOptions);
      const previous = client.getQueryData(groceriesOptions.queryKey);
      // Publish the entire burst in one cache update so the rows move together.
      client.setQueryData(groceriesOptions.queryKey, (items) => items?.map((item) => {
        const check = checks.find(({ id }) => id === item.id);
        return check ? { ...item, ...check } : item;
      }));
      return { previous };
    },
    onError: (error, checks, context) => {
      const failedIds = error instanceof GroceryCheckError ? error.failedIds : checks.map(({ id }) => id);
      client.setQueryData(groceriesOptions.queryKey, (items) => items?.map((item) => {
        const previous = context?.previous?.find(({ id }) => id === item.id);
        return previous && failedIds.includes(item.id)
          ? { ...item, status: previous.status, quantity: previous.quantity }
          : item;
      }));
    },
    onSettled: () => {
      if (client.isMutating({ mutationKey: ['editGroceryChecks'] }) === 1) {
        void client.invalidateQueries(groceriesOptions);
        void client.invalidateQueries({ queryKey: queryKeys.groceries.previews() });
      }
    },
  });
};

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
