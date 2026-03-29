import { BaseSheet } from '@/components/bottomSheets/base-sheet';
import { SheetAction } from '@/components/sheet-action';
import { Typography } from '@/components/Typography';
import { colors } from '@/constants/colors';
import { SheetManager, SheetProps } from 'react-native-actions-sheet';
import { ArrowLeftRight, MapPin, Trash2 } from 'lucide-react-native';
import { View } from 'react-native';
import { MealType, MealEntryDTO } from '@/api/types';
import { useDeleteScheduleEntry } from '@/api/schedules';

export type EditMealSheetData = MealEntryDTO & { mealType: MealType; dateString: string };

export const EditMealSheet = (props: SheetProps<'edit-meal-sheet'>) => {
  const { data } = props.payload ?? {};
  const deleteScheduleEntry = useDeleteScheduleEntry();

  if (!data) return null;

  const { dateString, mealType, ...entry } = data;
  const mealName = entry.type === 'recipe' ? entry.recipe.name : entry.name;
  const isDiningOut = entry.type === 'dining_out';

  return (
    <BaseSheet id={props.sheetId}>
      <View style={{ marginBottom: 24 }}>
        <Typography variant="heading-sm" weight="bold">
          What to do with{' '}
          <Typography
            variant="heading-sm"
            weight="bold"
            style={{ backgroundColor: colors.orange[100], paddingHorizontal: 4, paddingVertical: 2, marginTop: 4 }}
          >
            &ldquo;{mealName}&rdquo;
          </Typography>
          ?
        </Typography>
      </View>
      <View style={{ gap: 16, marginBottom: 12 }}>
        {isDiningOut && (
          <SheetAction
            text="Amend place"
            icon={MapPin}
            onPress={async () => {
              await SheetManager.hide('edit-meal-sheet');
              SheetManager.show('schedule-meal-sheet', {
                payload: {
                  type: 'restaurant',
                  dateString,
                  defaultMealType: mealType,
                  defaultRestaurant: entry.name,
                  swapFrom: mealType,
                },
              });
            }}
          />
        )}
        <SheetAction
          text={isDiningOut ? 'Swap for a meal' : 'Swap for a different meal'}
          icon={ArrowLeftRight}
          onPress={async () => {
            await SheetManager.hide('edit-meal-sheet');
            SheetManager.show('schedule-meal-sheet', {
              payload: { type: 'meal', dateString, mealType, swapFrom: mealType },
            });
          }}
        />
        <SheetAction
          text="Remove"
          icon={Trash2}
          onPress={() => {
            deleteScheduleEntry.mutate({ dateString, mealType });
            SheetManager.hide('edit-meal-sheet');
          }}
        />
      </View>
    </BaseSheet>
  );
};
