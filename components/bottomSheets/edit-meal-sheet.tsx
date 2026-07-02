import { BaseSheet } from '@/components/bottomSheets/base-sheet';
import { SheetAction } from '@/components/sheet-action';
import { Typography } from '@/components/Typography';
import { colors } from '@/constants/colors';
import { SheetProps, useSheets } from '@/lib/sheet-context';
import { ArrowLeftRight, MapPin, Trash2 } from 'lucide-react-native';
import { View } from 'react-native';
import { MealType, MealEntryDTO } from '@/api/types';
import { useDeleteScheduleEntry } from '@/api/schedules';

export type EditMealSheetData = MealEntryDTO & { mealType: MealType; dateString: string };

type EditMealSheetContentProps = {
  sheetId: SheetProps<'edit-meal-sheet'>['sheetId'];
  scheduledEntry: SheetProps<'edit-meal-sheet'>['data']['entry'];
};

const EditMealSheetContent = ({ sheetId, scheduledEntry }: EditMealSheetContentProps) => {
  const sheets = useSheets();
  const deleteScheduleEntry = useDeleteScheduleEntry();
  const { dateString, mealType, ...entry } = scheduledEntry;
  const mealName = entry.type === 'recipe' ? entry.recipe.name : entry.name;
  const isDiningOut = entry.type === 'dining_out';

  return (
    <>
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
            onPress={() => {
              sheets.dismiss(sheetId);
              sheets.present('schedule-meal-sheet', {
                data: {
                  type: 'restaurant',
                  dateString,
                  defaultMealType: mealType,
                  defaultRestaurant: entry.name,
                },
              });
            }}
          />
        )}
          <SheetAction
            text={isDiningOut ? 'Swap for a meal' : 'Swap for a different meal'}
            icon={ArrowLeftRight}
            onPress={() => {
              sheets.dismiss(sheetId);
              sheets.present('schedule-meal-sheet', {
                data: { type: 'meal', dateString, mealType },
              });
            }}
          />
          <SheetAction
            text="Remove"
            icon={Trash2}
            onPress={() => {
              deleteScheduleEntry.mutate({ dateString, mealType });
              sheets.dismiss(sheetId);
            }}
          />
      </View>
    </>
  );
};

export const EditMealSheet = (props: SheetProps<'edit-meal-sheet'>) => {
  return (
    <BaseSheet id={props.sheetId}>
      <EditMealSheetContent sheetId={props.sheetId} scheduledEntry={props.data.entry} />
    </BaseSheet>
  );
};
