import { SheetDefinition, SheetRegister } from 'react-native-actions-sheet';

import { AisleCategory, GroceryItemDTO } from '@/api/groceries';
import { IngredientFormData, MealType, MealEntryDTO } from '@/api/schedules';
import { RecipeDTO } from '@/api/recipes';
import { NavigationHelpers } from '@react-navigation/native';
import { TabParamList } from '@/app/(app)/(tabs)';

import { SelectUnitSheet, Unit } from '@/components/bottomSheets/select-unit-sheet';
import { SelectCategorySheet } from '@/components/bottomSheets/select-category-sheet';
import { EditIngredientSheet } from '@/components/bottomSheets/edit-ingredient-sheet';
import { GroceryItemSheet } from '@/components/bottomSheets/grocery-item-sheet';
import { ScheduleMealSheet } from '@/components/bottomSheets/schedule-meal-sheet';
import { RecipeOptionsSheet } from '@/components/bottomSheets/recipe-options-sheet';
import { LeaveFamilySheet } from '@/components/bottomSheets/leave-family-sheet';
import { ChangePasswordSheet } from '@/components/bottomSheets/change-password-sheet';
import { EditCalendarDaySheet } from '@/components/bottomSheets/edit-calendar-day-sheet';
import { EditMealSheet } from '@/components/bottomSheets/edit-meal-sheet';
import { InviteFamilyMemberSheet } from '@/components/bottomSheets/invite-family-member-sheet';
import { SelectDateSheet } from '@/components/bottomSheets/select-date-sheet';
import { SelectDateRangeSheet } from '@/components/bottomSheets/select-date-range-sheet';

declare module 'react-native-actions-sheet' {
  interface Sheets {
    'select-unit-sheet': SheetDefinition<{
      payload: { unit: Unit };
      returnValue: Unit | undefined;
    }>;
    'select-category-sheet': SheetDefinition<{
      returnValue: AisleCategory | undefined;
    }>;
    'edit-ingredient-sheet': SheetDefinition<{
      payload: { ingredient?: IngredientFormData };
      returnValue: IngredientFormData | undefined;
    }>;
    'grocery-item-sheet': SheetDefinition<{
      payload: { grocery?: GroceryItemDTO };
    }>;
    'schedule-meal-sheet': SheetDefinition<{
      payload:
        | {
            type: 'meal';
            dateString: string;
            mealType?: MealType;
          }
        | {
            type: 'restaurant';
            dateString: string;
            mealType?: MealType;
            defaultRestaurant?: string;
          };
    }>;
    'recipe-options-sheet': SheetDefinition<{
      payload: { recipe: RecipeDTO };
    }>;
    'leave-family-sheet': SheetDefinition;
    'change-password-sheet': SheetDefinition;
    'edit-calendar-day-sheet': SheetDefinition<{
      payload: {
        dateString: string;
        navigation: NavigationHelpers<TabParamList>;
      };
    }>;
    'edit-meal-sheet': SheetDefinition<{
      payload: {
        data: MealEntryDTO & { mealType: MealType; dateString: string };
      };
    }>;
    'invite-family-member-sheet': SheetDefinition;
    'select-date-sheet': SheetDefinition<{
      payload: undefined;
    }>;
    'select-date-range-sheet': SheetDefinition;
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
      'edit-calendar-day-sheet': EditCalendarDaySheet,
      'edit-meal-sheet': EditMealSheet,
      'invite-family-member-sheet': InviteFamilyMemberSheet,
      'select-date-sheet': SelectDateSheet,
      'select-date-range-sheet': SelectDateRangeSheet,
    }}
  />
);
