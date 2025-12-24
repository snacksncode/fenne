import { api } from '@/api';
import { Unit } from '@/components/bottomSheets/select-unit-sheet';
import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

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
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['editGroceryItem'],
    mutationFn: async (newItemData: Omit<Partial<GroceryItemDTO>, 'id'>) => {
      return api.patch(`/grocery_items/${id}`, { data: newItemData });
    },
    onSettled: () => queryClient.invalidateQueries(groceriesOptions),
  });
};

export const useAddGroceryItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['addGroceryItem'],
    mutationFn: async (newItemData: Omit<GroceryItemDTO, 'id'>) => {
      return api.post('/grocery_items', { data: newItemData });
    },
    onSettled: () => queryClient.invalidateQueries(groceriesOptions),
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
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['deleteGroceryItem'],
    mutationFn: async () => {
      return api.delete(`/grocery_items/${id}`);
    },
    onSettled: () => queryClient.invalidateQueries(groceriesOptions),
  });
};

export const useGroceryCheckout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['checkout'],
    mutationFn: async () => {
      return api.post(`/grocery_items/checkout`);
    },
    onSettled: () => queryClient.invalidateQueries(groceriesOptions),
  });
};
