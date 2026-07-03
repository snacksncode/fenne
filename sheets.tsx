import { SheetRegister } from '@/lib/sheet-context';

import {
  AisleCategory,
  GroceryItemDTO,
  IngredientFormData,
  MealType,
  MealEntryDTO,
  PantryEntryDTO,
  ProductDTO,
  RecipeDTO,
  ConsumptionLogDTO,
} from '@/api/types';
import { TabParamList } from '@/app/(app)/(tabs)';

import { SelectUnitSheet, Unit } from '@/components/bottomSheets/select-unit-sheet';
import { SelectCategorySheet } from '@/components/bottomSheets/select-category-sheet';
import { EditIngredientSheet } from '@/components/bottomSheets/edit-ingredient-sheet';
import { GroceryItemSheet } from '@/components/bottomSheets/grocery-item-sheet';
import { ScheduleMealSheet } from '@/components/bottomSheets/schedule-meal-sheet';
import { RecipeOptionsSheet } from '@/components/bottomSheets/recipe-options-sheet';
import { LeaveFamilySheet } from '@/components/bottomSheets/leave-family-sheet';
import { ChangePasswordSheet } from '@/components/bottomSheets/change-password-sheet';
import { ChangeDetailsSheet } from '@/components/bottomSheets/change-details-sheet';
import { EditCalendarDaySheet } from '@/components/bottomSheets/edit-calendar-day-sheet';
import { EditMealSheet } from '@/components/bottomSheets/edit-meal-sheet';
import { InviteFamilyMemberSheet } from '@/components/bottomSheets/invite-family-member-sheet';
import { SelectDateSheet } from '@/components/bottomSheets/select-date-sheet';
import { SelectDateRangeSheet } from '@/components/bottomSheets/select-date-range-sheet';
import { TutorialSheet } from '@/components/bottomSheets/tutorial-sheet';
import { ConvertGuestSheet } from '@/components/bottomSheets/convert-guest-sheet';
import { DeleteAccountSheet } from '@/components/bottomSheets/delete-account-sheet';
import { RecipeFilterSheet, MealFilter } from '@/components/bottomSheets/recipe-filter-sheet';
import { AddFromRecipeSheet } from '@/components/bottomSheets/add-from-recipe-sheet';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { SelectRecipeSheet } from '@/components/bottomSheets/select-recipe-sheet';
import { PantryEntrySheet } from '@/components/bottomSheets/pantry-entry-sheet';
import { ProductEditSheet } from '@/components/bottomSheets/product-edit-sheet';
import { PantryAddSheet } from '@/components/bottomSheets/pantry-add-sheet';
import { ConsumptionLogSheet } from '@/components/bottomSheets/consumption-log-sheet';
import { PantryFilter, PantryFilterSheet } from '@/components/bottomSheets/pantry-filter-sheet';

declare module '@/lib/sheet-context' {
  interface Sheets {
    'select-unit-sheet': {
      data: { unit: Unit };
      result: Unit;
    };
    'select-category-sheet': {
      result: AisleCategory;
    };
    'edit-ingredient-sheet': {
      data: { mode: 'create' | 'edit'; ingredient?: IngredientFormData };
      result: IngredientFormData;
    };
    'grocery-item-sheet': {
      data?: { grocery?: GroceryItemDTO };
    };
    'schedule-meal-sheet': {
      data:
        | {
            type: 'meal';
            dateString: string;
            mealType?: MealType;
          }
        | {
            type: 'restaurant';
            dateString: string;
            defaultMealType?: MealType;
            defaultRestaurant?: string;
          };
    };
    'recipe-options-sheet': {
      data: { recipe: RecipeDTO };
    };
    'leave-family-sheet': {};
    'change-password-sheet': {};
    'change-details-sheet': {};
    'convert-guest-sheet': {};
    'edit-calendar-day-sheet': {
      data: {
        dateString: string;
        navigation: BottomTabNavigationProp<TabParamList>;
      };
    };
    'edit-meal-sheet': {
      data: {
        entry: MealEntryDTO & { mealType: MealType; dateString: string };
      };
    };
    'invite-family-member-sheet': {};
    'select-date-sheet': {};
    'select-date-range-sheet': {};

    'tutorial-sheet': {};
    'delete-account-sheet': {
      data?: { variant?: 'account' | 'guest' };
      result: boolean;
    };
    'recipe-filter-sheet': {
      data: { current: MealFilter };
      result: MealFilter;
    };
    'add-from-recipe-sheet': {};
    'select-recipe-sheet': {
      result: RecipeDTO;
    };
    'pantry-entry-sheet': {
      data: { entry: PantryEntryDTO };
    };
    'pantry-add-sheet': {};
    'pantry-filter-sheet': {
      data: { current: PantryFilter };
      result: PantryFilter;
    };
    'consumption-log-sheet': {
      data: { log: ConsumptionLogDTO };
    };
    'product-edit-sheet': {
      data: { product: ProductDTO };
    };
  }
}

export const Sheets = () => (
  <SheetRegister
    sheets={{
      'select-unit-sheet': SelectUnitSheet,
      'select-category-sheet': SelectCategorySheet,
      'edit-ingredient-sheet': EditIngredientSheet,
      'grocery-item-sheet': GroceryItemSheet,
      'schedule-meal-sheet': ScheduleMealSheet,
      'recipe-options-sheet': RecipeOptionsSheet,
      'leave-family-sheet': LeaveFamilySheet,
      'change-password-sheet': ChangePasswordSheet,
      'change-details-sheet': ChangeDetailsSheet,
      'convert-guest-sheet': ConvertGuestSheet,
      'edit-calendar-day-sheet': EditCalendarDaySheet,
      'edit-meal-sheet': EditMealSheet,
      'invite-family-member-sheet': InviteFamilyMemberSheet,
      'select-date-sheet': SelectDateSheet,
      'select-date-range-sheet': SelectDateRangeSheet,
      'tutorial-sheet': TutorialSheet,
      'delete-account-sheet': DeleteAccountSheet,
      'recipe-filter-sheet': RecipeFilterSheet,
      'add-from-recipe-sheet': AddFromRecipeSheet,
      'select-recipe-sheet': SelectRecipeSheet,
      'pantry-entry-sheet': PantryEntrySheet,
      'pantry-add-sheet': PantryAddSheet,
      'pantry-filter-sheet': PantryFilterSheet,
      'consumption-log-sheet': ConsumptionLogSheet,
      'product-edit-sheet': ProductEditSheet,
    }}
  />
);
