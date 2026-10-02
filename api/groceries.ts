import { queryClient } from '@/query-client';
import type { MutationFunctionContext } from '@tanstack/react-query';
import { GroceryItemInput, GroceryPreviewDTO, GroceryItemDTO } from '@/api/types';
import { refreshFamilyData } from '@/lib/family-data';
import { client } from '@/api/client';
import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/api/query-keys';

const refreshGroceries = (
  _data: unknown, _error: Error | null, _variables: unknown, _result: unknown,
  { client }: MutationFunctionContext,
) => refreshFamilyData(client, { resource: 'grocery_items' });

export const groceriesRequests = {
  getAll: () => {
    return client.get<GroceryItemDTO[]>('/grocery_items');
  },
  add: (itemData: GroceryItemInput) => {
    return client.post<GroceryItemDTO>('/grocery_items', itemData);
  },
  addFromRecipe: (data: { recipe_id: string }) => {
    return client.post('/grocery_items/from_recipe', data);
  },
  edit: (data: Pick<GroceryItemDTO, 'id'> & Partial<Pick<GroceryItemDTO, 'quantity' | 'unit' | 'status'>> & { use_suggestion?: boolean }) => {
    const { id, ...itemData } = data;
    return client.patch<GroceryItemDTO>(`/grocery_items/${id}`, itemData);
  },
  delete: (data: { id: string }) => {
    return client.delete(`/grocery_items/${data.id}`);
  },
  generate: (data: { start: string; end: string; checked_product_ids: string[]; purchase_quantities?: { product_id: string; quantity: number | null }[] }) => {
    return client.post('/grocery_items/generate', data);
  },
  preview: (data: { start: string; end: string }) => {
    const params = new URLSearchParams({ start: data.start, end: data.end });
    return client.get<GroceryPreviewDTO>(`/grocery_items/preview?${params}`);
  },
  checkout: () => {
    return client.post('/grocery_items/checkout');
  },
};

export type GroceryCheck = Pick<GroceryItemDTO, 'id' | 'status'> & { quantity?: number };

class GroceryCheckError extends Error {
  constructor(readonly failedIds: string[]) {
    super('Could not save some grocery checks');
  }
}

export const editGroceryChecks = async (checks: GroceryCheck[]) => {
  const results = await Promise.allSettled(checks.map((check) => groceriesRequests.edit(check)));
  const failedIds = checks.filter((_, index) => results[index].status === 'rejected').map(({ id }) => id);
  if (failedIds.length) throw new GroceryCheckError(failedIds);
};

export const editGroceryChecksMutation = {
  meta: { persist: true },
  mutationKey: ['editGroceryChecks'],
  mutationFn: editGroceryChecks,
  onSettled: (_data: unknown, _error: Error | null, _variables: unknown, _result: unknown, { client }: MutationFunctionContext) => {
    if (client.isMutating({ mutationKey: ['editGroceryChecks'] }) === 1) {
      void refreshFamilyData(client, { resource: 'grocery_items' });
    }
  },
};

queryClient.setMutationDefaults(editGroceryChecksMutation.mutationKey, editGroceryChecksMutation);

export const useEditGroceryChecks = () => {
  const client = useQueryClient();
  return useMutation({
    ...editGroceryChecksMutation,
    onMutate: async (checks) => {
      await client.cancelQueries(groceriesQuery);
      const previous = client.getQueryData(groceriesQuery.queryKey);
      // Publish the entire burst in one cache update so the rows move together.
      client.setQueryData(groceriesQuery.queryKey, (items) => items?.map((item) => {
        const check = checks.find(({ id }) => id === item.id);
        return check ? { ...item, ...check } : item;
      }));
      return { previous, query: client.getQueryCache().find(groceriesQuery) };
    },
    onError: (error, checks, context) => {
      if (client.getQueryCache().find(groceriesQuery) !== context?.query) return;
      const failedIds = error instanceof GroceryCheckError ? error.failedIds : checks.map(({ id }) => id);
      client.setQueryData(groceriesQuery.queryKey, (items) => items?.map((item) => {
        const previous = context?.previous?.find(({ id }) => id === item.id);
        const check = checks.find(({ id }) => id === item.id);
        if (!previous || !check || !failedIds.includes(item.id)) return item;
        return {
          ...item,
          ...(item.status === check.status && { status: previous.status }),
          ...(check.quantity !== undefined && item.quantity === check.quantity && { quantity: previous.quantity }),
        };
      }));
    },
  });
};

export const groceriesQuery = queryOptions({
  queryKey: queryKeys.groceries.all(),
  queryFn: groceriesRequests.getAll,
  staleTime: Infinity,
});

export const useGroceries = () => {
  return useQuery(groceriesQuery);
};

export const groceryPreviewQuery = (start: string, end: string) =>
  queryOptions({
    queryKey: queryKeys.groceries.preview(start, end),
    queryFn: () => groceriesRequests.preview({ start, end }),
  });

export const useGroceryPreview = ({ start, end, enabled }: { start?: string; end?: string; enabled?: boolean }) => {
  return useQuery({
    ...groceryPreviewQuery(start ?? '', end ?? ''),
    enabled: enabled !== false && start != null && end != null,
  });
};

export const editGroceryItemMutation = {
  meta: { persist: true },
  mutationKey: ['editGroceryItem'],
  mutationFn: groceriesRequests.edit,
  onSettled: refreshGroceries,
};

queryClient.setMutationDefaults(editGroceryItemMutation.mutationKey, editGroceryItemMutation);

export const useEditGroceryItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    ...editGroceryItemMutation,
    onMutate: async (change) => {
      await queryClient.cancelQueries(groceriesQuery);
      const query = queryClient.getQueryCache().find(groceriesQuery);
      const previous = queryClient.getQueryData(groceriesQuery.queryKey)?.find(({ id }) => id === change.id);
      queryClient.setQueryData(groceriesQuery.queryKey, (items) => items?.map((item) => item.id === change.id ? { ...item, ...change } : item));
      return { previous, query };
    },
    onError: (_error, change, context) => {
      if (!context?.previous || queryClient.getQueryCache().find(groceriesQuery) !== context.query) return;
      const previous = context.previous;
      queryClient.setQueryData(groceriesQuery.queryKey, (items) => items?.map((item) => {
        if (item.id !== change.id) return item;
        // A failed edit only restores fields it still owns, never another entry's newer write.
        return {
          ...item,
          ...(change.quantity !== undefined && item.quantity === change.quantity && { quantity: previous.quantity }),
          ...(change.unit !== undefined && item.unit === change.unit && { unit: previous.unit }),
          ...(change.status !== undefined && item.status === change.status && { status: previous.status }),
        };
      }));
    },
  });
};

export const addGroceryItemMutation = {
  meta: { persist: true },
  mutationKey: ['addGroceryItem'],
  mutationFn: groceriesRequests.add,
  onSettled: refreshGroceries,
};

queryClient.setMutationDefaults(addGroceryItemMutation.mutationKey, addGroceryItemMutation);

export const useAddGroceryItem = () => useMutation(addGroceryItemMutation);

export const addRecipeToGroceriesMutation = {
  meta: { persist: true },
  mutationKey: ['addRecipeToGroceries'],
  mutationFn: groceriesRequests.addFromRecipe,
  onSettled: refreshGroceries,
};

queryClient.setMutationDefaults(addRecipeToGroceriesMutation.mutationKey, addRecipeToGroceriesMutation);

export const useAddRecipeToGroceries = () => useMutation(addRecipeToGroceriesMutation);

export const generateGroceryItemsMutation = {
  meta: { persist: true },
  mutationKey: ['generateGroceryItems'],
  mutationFn: groceriesRequests.generate,
  onSettled: refreshGroceries,
};

queryClient.setMutationDefaults(generateGroceryItemsMutation.mutationKey, generateGroceryItemsMutation);

export const useGenerateGroceryItems = () => useMutation(generateGroceryItemsMutation);

export const deleteGroceryItemMutation = {
  meta: { persist: true },
  mutationKey: ['deleteGroceryItem'],
  mutationFn: groceriesRequests.delete,
  onSettled: refreshGroceries,
};

queryClient.setMutationDefaults(deleteGroceryItemMutation.mutationKey, deleteGroceryItemMutation);

export const useDeleteGroceryItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    ...deleteGroceryItemMutation,
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries(groceriesQuery);
      const query = queryClient.getQueryCache().find(groceriesQuery);
      const removed = queryClient.getQueryData(groceriesQuery.queryKey)?.find((item) => item.id === id);
      queryClient.setQueryData(groceriesQuery.queryKey, (items) => items?.filter((item) => item.id !== id));
      return { removed, query };
    },
    onError: (_error, _variables, context) => {
      if (!context?.removed || queryClient.getQueryCache().find(groceriesQuery) !== context.query) return;
      const removed = context.removed;
      queryClient.setQueryData(groceriesQuery.queryKey, (items) => items && !items.some(({ id }) => id === removed.id) ? [...items, removed] : items);
    },
  });
};

export const groceryCheckoutMutation = {
  meta: { persist: true },
  mutationKey: ['checkout'],
  mutationFn: groceriesRequests.checkout,
  onSettled: (_data: unknown, _error: Error | null, _variables: void, _result: unknown, { client }: MutationFunctionContext) =>
    refreshFamilyData(client, { resource: 'checkout' }),
};

queryClient.setMutationDefaults(groceryCheckoutMutation.mutationKey, groceryCheckoutMutation);

export const useGroceryCheckout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    ...groceryCheckoutMutation,
    onMutate: async () => {
      await queryClient.cancelQueries(groceriesQuery);
      const query = queryClient.getQueryCache().find(groceriesQuery);
      const removed = queryClient.getQueryData(groceriesQuery.queryKey)?.filter((item) => item.status === 'completed') ?? [];
      queryClient.setQueryData(groceriesQuery.queryKey, (items) => items?.filter((item) => item.status !== 'completed'));
      return { removed, query };
    },
    onError: (_error, _variables, context) => {
      if (!context || queryClient.getQueryCache().find(groceriesQuery) !== context.query) return;
      queryClient.setQueryData(groceriesQuery.queryKey, (items) => items && [
        ...items,
        ...context.removed.filter((removed) => !items.some(({ id }) => id === removed.id)),
      ]);
    },
  });
};
