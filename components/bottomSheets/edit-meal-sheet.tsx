import { BaseSheet } from '@/components/bottomSheets/base-sheet';
import { MealDTO } from '@/components/menu/weekly-screen';
import { Text } from '@/components/Text';
import { useOnPressWithFeedback } from '@/hooks/use-tap-feedback-gesture';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { ArrowLeftRight, Trash2 } from 'lucide-react-native';
import { FunctionComponent, RefObject } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';

export type EditMealSheetData = { meal: MealDTO };

type SheetProps = {
  ref: RefObject<BottomSheetModal<EditMealSheetData> | null>;
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

export const EditMealSheet = ({ ref }: SheetProps) => {
  return (
    <BaseSheet<EditMealSheetData> ref={ref}>
      {({ data }) => (
        <BaseSheet.Container>
          <Text style={styles.header}>
            What to do with{'\n'}
            <Text style={{ backgroundColor: '#F5D2BB' }}>&ldquo;{data?.meal.name}&rdquo;</Text>?
          </Text>
          <View style={{ gap: 16, marginBottom: 12 }}>
            <Action
              text="Swap for another meal"
              icon={ArrowLeftRight}
              onPress={() => {
                alert('Swap');
                ref.current?.dismiss();
              }}
            />
            <Action
              text="Remove"
              icon={Trash2}
              onPress={() => {
                alert('Remove');
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
