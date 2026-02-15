import { BaseSheet } from '@/components/bottomSheets/base-sheet';
import { Typography } from '@/components/Typography';
import { colors } from '@/constants/colors';
import { useOnPressWithFeedback } from '@/hooks/use-tap-feedback-gesture';
import { SheetManager, SheetProps } from 'react-native-actions-sheet';
import { ArrowLeftRight, MapPin, Trash2 } from 'lucide-react-native';
import { FunctionComponent } from 'react';
import { View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { MealEntryDTO, MealType, useDeleteScheduleEntry } from '@/api/schedules';

export type EditMealSheetData = MealEntryDTO & { mealType: MealType; dateString: string };

type ActionProps = {
  onPress: () => void;
  text: string;
  icon: FunctionComponent<{ size: number; color: string }>;
};

const Action = ({ onPress, text, icon: Icon }: ActionProps) => {
  const { gesture, scaleStyle } = useOnPressWithFeedback({ onPress, scaleTo: 0.985 });
  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[{ flexDirection: 'row', gap: 12, alignItems: 'center' }, scaleStyle]}>
        <View style={{ backgroundColor: '#493D34', padding: 4, borderRadius: 4 }}>
          <Icon color="#FEF7EA" size={20} />
        </View>
        <Typography variant="body-base" weight="bold">
          {text}
        </Typography>
      </Animated.View>
    </GestureDetector>
  );
};

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
          <Action
            text="Amend place"
            icon={MapPin}
            onPress={async () => {
              await SheetManager.hide('edit-meal-sheet');
              SheetManager.show('schedule-meal-sheet', {
                payload: { type: 'restaurant', dateString, defaultMealType: mealType, defaultRestaurant: entry.name },
              });
            }}
          />
        )}
        <Action
          text={isDiningOut ? 'Swap for a meal' : 'Swap for a different meal'}
          icon={ArrowLeftRight}
          onPress={async () => {
            await SheetManager.hide('edit-meal-sheet');
            SheetManager.show('schedule-meal-sheet', { payload: { type: 'meal', dateString, mealType } });
          }}
        />
        <Action
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
