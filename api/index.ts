import { first, isDefined, last, pickBy } from 'remeda';
import { client } from '@/api/client';
import { getDatesFromISOWeek } from '@/date-tools';
import { ensure } from '@/utils';
import {
  GroceryItemDTO,
  GroceryItemInput,
  GroceryPreviewDTO,
  ProductCatalog,
  RecipeDTO,
  RecipeInputDTO,
  MealType,
  ScheduleDayDTO,
  ScheduleDayInput,
  ProductDTO,
  PurchaseSuggestionDTO,
  ProductDraft,
  ProductUsagesDTO,
  PantryEntryDTO,
  ConsumptionLogDTO,
} from '@/api/types';
import { AuthResponse, CurrentUserDTO } from '@/api/auth';
import { InvitationsDTO } from '@/api/invitations';

export const api = {
  auth: {
    login: (data: { email: string; password: string }) => {
      return client.post<AuthResponse>('/login', data);
    },
    loginAsGuest: () => {
      return client.post<AuthResponse>('/guest');
    },
    convertGuest: (data: { name: string; email: string; password: string }) => {
      return client.post('/convert_guest', data);
    },
    getCurrentUser: () => {
      return client.get<CurrentUserDTO>('/me');
    },
    changePassword: (data: { current_password: string; new_password: string }) => {
      return client.post('/change_password', data);
    },
    changeDetails: (data: { name?: string; email?: string }) => {
      return client.post('/change_details', data);
    },
    deleteAccount: () => {
      return client.delete('/delete_account');
    },
  },
  groceries: {
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
  },
  recipes: {
    getAll: () => {
      return client.get<RecipeDTO[]>('/recipes');
    },
    get: (id: string) => {
      return client.get<RecipeDTO>(`/recipes/${id}`);
    },
    add: (recipe: RecipeInputDTO) => {
      return client.post<RecipeDTO>('/recipes', recipe);
    },
    edit: (recipe: RecipeInputDTO & { id: string }) => {
      const { id, ...recipeData } = recipe;
      return client.patch<RecipeDTO>(`/recipes/${id}`, pickBy(recipeData, isDefined));
    },
    delete: (data: { id: string }) => {
      return client.delete(`/recipes/${data.id}`);
    },
  },
  schedules: {
    get: (weekKey: string) => {
      const weekDates = getDatesFromISOWeek(weekKey);
      const searchParams = new URLSearchParams();
      searchParams.append('start', ensure(first(weekDates)));
      searchParams.append('end', ensure(last(weekDates)));
      return client.get<ScheduleDayDTO[]>(`/schedule?${searchParams.toString()}`);
    },
    updateDay: (data: ScheduleDayInput) => {
      const { dateString, ...requestData } = data;
      return client.put(`/schedule/${dateString}`, requestData);
    },
    deleteEntry: (data: { dateString: string; mealType: MealType }) => {
      const { dateString, mealType } = data;
      return client.put(`/schedule/${dateString}`, {
        ...(mealType === 'breakfast' && { breakfast: null }),
        ...(mealType === 'lunch' && { lunch: null }),
        ...(mealType === 'dinner' && { dinner: null }),
      });
    },
  },
  invitations: {
    getAll: () => {
      return client.get<InvitationsDTO>('/invitations');
    },
    post: (data: { email: string }) => {
      return client.post('/invitations', data);
    },
    accept: (data: { id: string }) => {
      return client.post(`/invitations/${data.id}/accept`);
    },
    decline: (data: { id: string }) => {
      return client.post(`/invitations/${data.id}/decline`);
    },
    remove: (data: { id: string }) => {
      return client.delete(`/invitations/${data.id}`);
    },
    leaveFamily: () => {
      return client.post('/leave_family');
    },
  },
  family: {
    updatePreferences: (data: { timezone?: string | null }) => {
      return client.patch('/family/preferences', data);
    },
  },
  products: {
    purchaseSuggestion: (id: string, needed: number, pantry: number) => {
      const params = new URLSearchParams({ needed: String(needed), pantry: String(pantry) });
      return client.get<PurchaseSuggestionDTO>(`/products/${id}/purchase_suggestion?${params}`);
    },
    getAll: () => {
      return client.get<ProductDTO[]>('/products');
    },
    edit: (data: Pick<ProductDTO, 'id'> & Partial<ProductDraft> & { impact_acknowledged?: boolean }) => {
      const { id, ...productData } = data;
      return client.patch<ProductDTO>(`/products/${id}`, productData);
    },
    usages: (id: string) => {
      return client.get<ProductUsagesDTO>(`/products/${id}/usages`);
    },
    delete: (data: { id: string }) => {
      return client.delete(`/products/${data.id}`);
    },
    catalog: () => client.get<ProductCatalog>('/product_catalog'),
  },
  pantry: {
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
  },
  consumptionLogs: {
    getAll: () => {
      return client.get<ConsumptionLogDTO[]>('/consumption_logs');
    },
    add: (data: { recipe_id: string; meal_type: MealType; schedule_date: string }) => {
      return client.post<ConsumptionLogDTO>('/consumption_logs', data);
    },
    delete: (data: { id: string }) => {
      return client.deleteWithMeta<null>(`/consumption_logs/${data.id}`);
    },
  },
};
