import { api } from '@/api';
import { Unit } from '@/components/bottomSheets/select-unit-sheet';
import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useOptimisticUpdate, tempId } from '@/api/optimistic';

export type AisleCategory =
  | 'produce'
  | 'bakery'
  | 'dairy_eggs'
  | 'meat'
  | 'seafood'
  | 'pantry'
  | 'frozen_foods'
  | 'beverages'
  | 'snacks'
  | 'condiments_sauces'
  | 'spices_baking'
  | 'household'
  | 'personal_care'
  | 'pet_supplies'
  | 'other';

export type GroceryItemDTO = {
  id: string;
  name: string;
  quantity: number;
  unit: Unit;
  status: 'pending' | 'completed';
  aisle: AisleCategory;
};

export const groceriesOptions = queryOptions({
  queryKey: ['groceries'] as const,
  queryFn: async () => {
    return api.get<GroceryItemDTO[]>('/grocery_items');
  },
  staleTime: Infinity,
});

export const useGroceries = () => {
  return useQuery(groceriesOptions);
};

export const useEditGroceryItem = ({ id }: { id: string }) => {
  const { update, revert } = useOptimisticUpdate();
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['editGroceryItem'],
    mutationFn: async (newItemData: Omit<Partial<GroceryItemDTO>, 'id'>) => {
      return api.patch(`/grocery_items/${id}`, { data: newItemData });
    },
    onMutate: async (newItemData) => {
      const { previousData } = await update({
        queryKey: groceriesOptions.queryKey,
        updateFn: (state) => {
          const item = state.find((i) => i.id === id);
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
    },
  });
};

export const useAddGroceryItem = () => {
  const { update, revert } = useOptimisticUpdate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['addGroceryItem'],
    mutationFn: async (newItemData: Omit<GroceryItemDTO, 'id'>) => {
      return api.post('/grocery_items', { data: newItemData });
    },
    onMutate: async (newItemData) => {
      const { previousData } = await update({
        queryKey: groceriesOptions.queryKey,
        updateFn: (state) => {
          state.push({ ...newItemData, id: tempId() });
        },
      });
      return { previousData, queryKey: groceriesOptions.queryKey };
    },
    onError: (_err, _vars, context) => {
      if (context) revert(context);
    },
    onSettled: () => {
      queryClient.invalidateQueries(groceriesOptions);
    },
  });
};

export const useGenerateGroceryItems = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['generateGroceryItems'],
    mutationFn: async (range: { start: string; end: string }) => {
      return api.post('/grocery_items/generate', { ...range });
    },
    onSettled: () => queryClient.invalidateQueries(groceriesOptions),
  });
};

export const useDeleteGroceryItem = ({ id }: { id: string }) => {
  const { update, revert } = useOptimisticUpdate();
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['deleteGroceryItem'],
    mutationFn: async () => {
      return api.delete(`/grocery_items/${id}`);
    },
    onMutate: async () => {
      const { previousData } = await update({
        queryKey: groceriesOptions.queryKey,
        updateFn: (state) => state.filter((i) => i.id === id),
      });
      return { previousData, queryKey: groceriesOptions.queryKey };
    },
    onError: (_err, _vars, context) => {
      if (context) revert(context);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: groceriesOptions.queryKey });
    },
  });
};

export const useGroceryCheckout = () => {
  const { update, revert } = useOptimisticUpdate();
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['checkout'],
    mutationFn: async () => {
      return api.post('/grocery_items/checkout');
    },
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
      queryClient.invalidateQueries({ queryKey: groceriesOptions.queryKey });
    },
  });
};
