import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { nanoid } from 'nanoid/non-secure';

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
  status: 'pending' | 'completed';
  aisle: AisleCategory;
};

let groceries: GroceryItemDTO[] = [
  { id: 'a1b2c3d4e5f6g7h8i9j0', name: 'Bananas', status: 'pending', aisle: 'produce' },
  { id: '7g_ZVfXTOkuOAVtXq2v7', name: 'Oranges', status: 'pending', aisle: 'produce' },
  { id: 'R1S2T3U4V5W6X7Y8Z9A0', name: 'Large Eggs', status: 'pending', aisle: 'dairy_eggs' },
  // { id: 'K2L3M4N5O6P7Q8R9S0T1', name: 'Whole Wheat Bread', status: 'pending', aisle: 'bakery' },
  // { id: 'x7y8z9A0B1C2D3E4F5G6', name: 'Croissants', status: 'pending', aisle: 'bakery' },
  // { id: 'H7I8J9K0L1M2N3O4P5Q6', name: 'Milk (2%)', status: 'pending', aisle: 'dairy_eggs' },
  // { id: 'B2C3D4E5F6G7H8I9J0K1', name: 'Cheddar Cheese', status: 'pending', aisle: 'dairy_eggs' },
  // { id: 'L3M4N5O6P7Q8R9S0T1U2', name: 'Chicken Breasts', status: 'pending', aisle: 'meat' },
  // { id: 'V4W5X6Y7Z8A9B0C1D2E3', name: 'Ground Beef (80/20)', status: 'pending', aisle: 'meat' },
  // { id: 'F5G6H7I8J9K0L1M2N3O4', name: 'Salmon Fillets', status: 'pending', aisle: 'seafood' },
  // { id: 'P6Q7R8S9T0U1V2W3X4Y5', name: 'Shrimp', status: 'pending', aisle: 'seafood' },
  // { id: 'Z7A8B9C0D1E2F3G4H5I6', name: 'Pasta (Spaghetti)', status: 'pending', aisle: 'pantry' },
  // { id: 'J8K9L0M1N2O3P4Q5R6S7', name: 'Olive Oil', status: 'pending', aisle: 'pantry' },
  // { id: 'T9U0V1W2X3Y4Z5A6B7C8', name: 'Canned Tomatoes', status: 'pending', aisle: 'pantry' },
  // { id: 'D0E1F2G3H4I5J6K7L8M9', name: 'Frozen Peas', status: 'pending', aisle: 'frozen_foods' },
  // { id: 'N1O2P3Q4R5S6T7U8V9W0', name: 'Ice Cream (Vanilla)', status: 'pending', aisle: 'frozen_foods' },
  // { id: 'X2Y3Z4A5B6C7D8E9F0G1', name: 'Orange Juice', status: 'pending', aisle: 'beverages' },
  // { id: 'H3I4J5K6L7M8N9O0P1Q2', name: 'Coffee (Ground)', status: 'pending', aisle: 'beverages' },
  // { id: 'R4S5T6U7V8W9X0Y1Z2A3', name: 'Potato Chips', status: 'pending', aisle: 'snacks' },
  // { id: 'B5C6D7E8F9G0H1I2J3K4', name: 'Granola Bars', status: 'pending', aisle: 'snacks' },
  // { id: 'L6M7N8O9P0Q1R2S3T4U5', name: 'Ketchup', status: 'pending', aisle: 'condiments_sauces' },
  // { id: 'V7W8X9Y0Z1A2B3C4D5E6', name: 'Mayonnaise', status: 'pending', aisle: 'condiments_sauces' },
  // { id: 'F8G9H0I1J2K3L4M5N6O7', name: 'Salt', status: 'pending', aisle: 'spices_baking' },
  // { id: 'P9Q0R1S2T3U4V5W6X7Y8', name: 'Black Pepper', status: 'pending', aisle: 'spices_baking' },
  // { id: 'Z0A1B2C3D4E5F6G7H8I9', name: 'Dish Soap', status: 'pending', aisle: 'household' },
  // { id: 'J1K2L3M4N5O6P7Q8R9S0', name: 'Paper Towels', status: 'pending', aisle: 'household' },
  // { id: 'T2U3V4W5X6Y7Z8A9B0C1', name: 'Toothpaste', status: 'pending', aisle: 'personal_care' },
  // { id: 'D3E4F5G6H7I8J9K0L1M2', name: 'Shampoo', status: 'pending', aisle: 'personal_care' },
  // { id: 'N4O5P6Q7R8S9T0U1V2W3', name: 'Dog Food', status: 'pending', aisle: 'pet_supplies' },
  // { id: 'X5Y6Z7A8B9C0D1E2F3G4', name: 'Cat Litter', status: 'pending', aisle: 'pet_supplies' },
  // { id: 'H6I7J8K9L0M1N2O3P4Q5', name: 'Batteries (AA)', status: 'pending', aisle: 'other' },
  // { id: 'R7S8T9U0V1W2X3Y4Z5A6', name: 'Light Bulbs', status: 'pending', aisle: 'other' },
];

const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));

export const groceriesOptions = queryOptions({
  queryKey: ['groceries'] as const,
  queryFn: async () => {
    await wait(1000);
    return groceries;
  },
});

export const useGroceries = () => {
  return useQuery(groceriesOptions);
};

export const useEditGroceryItem = ({ id }: { id: string }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['editGroceryItem'],
    mutationFn: async (newItemData: Omit<Partial<GroceryItemDTO>, 'id'>) => {
      await wait(500);
      groceries = groceries.map((item) => {
        if (item.id !== id) return item;
        return { ...item, ...newItemData };
      });
    },
    onMutate: async (newItemData) => {
      await queryClient.cancelQueries(groceriesOptions);
      const previous = queryClient.getQueryData(groceriesOptions.queryKey);
      queryClient.setQueryData(groceriesOptions.queryKey, (prev) => {
        return prev?.map((item) => {
          if (item.id !== id) return item;
          return { ...item, ...newItemData };
        });
      });
      return { previous };
    },
    onError: (_err, _newItemData, context) => {
      if (context) queryClient.setQueryData(groceriesOptions.queryKey, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: groceriesOptions.queryKey }),
  });
};

export const useAddGroceryItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['addGroceryItem'],
    mutationFn: async (newItemData: Omit<GroceryItemDTO, 'id'>) => {
      await wait(500);
      groceries = [...groceries, { ...newItemData, id: nanoid() }];
    },
    onMutate: async (newItemData) => {
      await queryClient.cancelQueries(groceriesOptions);
      const previous = queryClient.getQueryData(groceriesOptions.queryKey);
      queryClient.setQueryData(groceriesOptions.queryKey, (prev) => {
        return [...(prev ?? []), { ...newItemData, id: nanoid() }];
      });
      return { previous };
    },
    onError: (_err, _newItemData, context) => {
      if (context) queryClient.setQueryData(groceriesOptions.queryKey, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: groceriesOptions.queryKey }),
  });
};

export const useDeleteGroceryItem = ({ id }: { id: string }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['deleteGroceryItem'],
    mutationFn: async () => {
      await wait(500);
      groceries = groceries.filter((item) => item.id !== id);
    },
    onMutate: async () => {
      await queryClient.cancelQueries(groceriesOptions);
      const previous = queryClient.getQueryData(groceriesOptions.queryKey);
      queryClient.setQueryData(groceriesOptions.queryKey, (prev) => prev?.filter((item) => item.id !== id));
      return { previous };
    },
    onError: (_err, _newItemData, context) => {
      if (context) queryClient.setQueryData(groceriesOptions.queryKey, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: groceriesOptions.queryKey }),
  });
};

export const useGroceryCheckout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['checkout'],
    mutationFn: async () => {
      await wait(500);
      groceries = groceries.filter((item) => item.status !== 'completed');
    },
    onMutate: async () => {
      await queryClient.cancelQueries(groceriesOptions);
      const previous = queryClient.getQueryData(groceriesOptions.queryKey);
      queryClient.setQueryData(groceriesOptions.queryKey, (prev) => {
        return prev?.filter((item) => item.status !== 'completed');
      });
      return { previous };
    },
    onError: (_err, _newItemData, context) => {
      if (context) queryClient.setQueryData(groceriesOptions.queryKey, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: groceriesOptions.queryKey }),
  });
};
