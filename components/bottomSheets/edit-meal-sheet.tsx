import { BaseSheet } from '@/components/bottomSheets/base-sheet';
import { Text } from '@/components/Text';
import { colors } from '@/constants/colors';
import { useOnPressWithFeedback } from '@/hooks/use-tap-feedback-gesture';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { ArrowLeftRight, MapPin, Trash2 } from 'lucide-react-native';
import { FunctionComponent, RefObject } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { MealEntryDTO, MealType } from '@/api/schedules';
import { ensure } from '@/utils';

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
        <Text style={styles.actionText}>{text}</Text>
      </Animated.View>
    </GestureDetector>
  );
};

type ContentProps = {
  data: EditMealSheetData;
  onAmendPlace: (params: { dateString: string; defaultMealType: MealType; defaultRestaurant: string }) => void;
  onSwapMeal: (params: { dateString: string; mealType: MealType }) => void;
  onRemove: (params: { dateString: string; mealType: MealType }) => void;
};

export const EditMealSheetContent = ({ data, onAmendPlace, onSwapMeal, onRemove }: ContentProps) => {
  const { dateString, mealType, ...entry } = data;
  const mealName = entry.type === 'recipe' ? entry.recipe.name : entry.name;
  const isDiningOut = entry.type === 'dining_out';

  return (
    <BaseSheet.Container>
      <Text style={styles.header}>
        What to do with{'\n'}
        <Text style={{ backgroundColor: colors.orange[100] }}>&ldquo;{mealName}&rdquo;</Text>?
      </Text>
      <View style={{ gap: 16, marginBottom: 12 }}>
        {isDiningOut && (
          <Action
            text="Amend place"
            icon={MapPin}
            onPress={() => onAmendPlace({ dateString, defaultMealType: mealType, defaultRestaurant: entry.name })}
          />
        )}
        <Action
          text={isDiningOut ? 'Swap for a meal' : 'Swap for a different meal'}
          icon={ArrowLeftRight}
          onPress={() => onSwapMeal({ dateString, mealType })}
        />
        <Action text="Remove" icon={Trash2} onPress={() => onRemove({ dateString, mealType })} />
      </View>
    </BaseSheet.Container>
  );
};

type SheetProps = {
  ref: RefObject<BottomSheetModal<EditMealSheetData> | null>;
  onAmendPlace: (params: { dateString: string; defaultMealType: MealType; defaultRestaurant: string }) => void;
  onSwapMeal: (params: { dateString: string; mealType: MealType }) => void;
  onRemove: (params: { dateString: string; mealType: MealType }) => void;
};

export const EditMealSheet = ({ ref, onAmendPlace, onSwapMeal, onRemove }: SheetProps) => (
  <BaseSheet<EditMealSheetData> ref={ref}>
    {({ data }) => (
      <EditMealSheetContent
        data={ensure(data)}
        onAmendPlace={onAmendPlace}
        onSwapMeal={onSwapMeal}
        onRemove={onRemove}
      />
    )}
  </BaseSheet>
);

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
