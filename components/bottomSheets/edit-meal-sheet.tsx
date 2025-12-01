import { BaseSheet } from '@/components/bottomSheets/base-sheet';
import { RecipeDTO } from '@/api/recipes';
import { Text } from '@/components/Text';
import { colors } from '@/constants/colors';
import { useOnPressWithFeedback } from '@/hooks/use-tap-feedback-gesture';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { ArrowLeftRight, Trash2 } from 'lucide-react-native';
import { FunctionComponent, RefObject } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { MealType, useDeleteScheduleEntry } from '@/api/schedules';
import { ensure } from '@/utils';
import { ScheduleMealSheetData } from '@/components/bottomSheets/schedule-meal-sheet';

export type EditMealSheetData = {
  meal: RecipeDTO;
  mealType: MealType;
  dateString: string;
};

type SheetProps = {
  ref: RefObject<BottomSheetModal<EditMealSheetData> | null>;
  scheduleMealSheetRef: RefObject<BottomSheetModal<ScheduleMealSheetData> | null>;
};

const Action = (props: {
  onPress: () => void;
  text: string;
  icon: FunctionComponent<{ size: number; color: string }>;
}) => {
  const { gesture, scaleStyle } = useOnPressWithFeedback({ onPress: props.onPress, scaleTo: 0.985 });
  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[{ flexDirection: 'row', gap: 12, alignItems: 'center' }, scaleStyle]}>
        <View style={{ backgroundColor: '#493D34', padding: 4, borderRadius: 4 }}>
          <props.icon color="#FEF7EA" size={20} />
        </View>
        <Text style={styles.actionText}>{props.text}</Text>
      </Animated.View>
    </GestureDetector>
  );
};

export const EditMealSheet = ({ ref, scheduleMealSheetRef }: SheetProps) => {
  const deleteScheduleEntry = useDeleteScheduleEntry();
  return (
    <BaseSheet<EditMealSheetData> ref={ref}>
      {({ data }) => (
        <BaseSheet.Container>
          <Text style={styles.header}>
            What to do with{'\n'}
            <Text style={{ backgroundColor: colors.orange[100] }}>&ldquo;{data?.meal.name}&rdquo;</Text>?
          </Text>
          <View style={{ gap: 16, marginBottom: 12 }}>
            <Action
              text="Swap for another meal"
              icon={ArrowLeftRight}
              onPress={() => {
                const { dateString, mealType } = ensure(data);
                scheduleMealSheetRef.current?.present({ dateString, mealType });
                ref.current?.dismiss();
              }}
            />
            <Action
              text="Remove"
              icon={Trash2}
              onPress={() => {
                const { dateString, mealType } = ensure(data);
                deleteScheduleEntry.mutate({ date: dateString, mealType });
                ref.current?.dismiss();
              }}
            />
          </View>
        </BaseSheet.Container>
      )}
    </BaseSheet>
  );
};

const styles = StyleSheet.create({
  header: {
    marginBottom: 24,
    color: '#4A3E36',
    fontFamily: 'Satoshi-Bold',
    fontSize: 20,
    lineHeight: 20 * 1.25,
  },
  actionText: {
    color: '#4A3E36',
    fontFamily: 'Satoshi-Bold',
    fontSize: 16,
    lineHeight: 16 * 1.25,
  },
});
