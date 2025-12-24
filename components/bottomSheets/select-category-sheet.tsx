import { AisleCategory } from '@/api/groceries';
import { AisleHeader } from '@/components/aisle-header';
import { BaseSheet } from '@/components/bottomSheets/base-sheet';
import { PressableWithHaptics } from '@/components/pressable-with-feedback';
import { Text } from '@/components/Text';
import useTimeout from '@/hooks/use-timeout';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { RefObject, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const aisles: AisleCategory[] = [
  'produce',
  'bakery',
  'dairy_eggs',
  'meat',
  'seafood',
  'pantry',
  'frozen_foods',
  'beverages',
  'snacks',
  'condiments_sauces',
  'spices_baking',
  'household',
  'personal_care',
  'pet_supplies',
  'other',
];

const CategoryContent = (props: { onSelect: (aisle: AisleCategory) => void }) => {
  const [ready, setReady] = useState(false);
  useTimeout(() => setReady(true), 500);
  const insets = useSafeAreaInsets();

  return (
    <BottomSheetScrollView>
      <View style={{ paddingHorizontal: 20 }}>
        <Text style={styles.header}>Select a category</Text>
      </View>
      <View style={[{ paddingHorizontal: 20, paddingBottom: insets.bottom }, !ready && { pointerEvents: 'none' }]}>
        {aisles.map((aisle) => (
          <PressableWithHaptics style={{ paddingVertical: 6 }} onPress={() => props.onSelect(aisle)} key={aisle}>
            <AisleHeader type={aisle} />
          </PressableWithHaptics>
        ))}
      </View>
    </BottomSheetScrollView>
  );
};

export const SelectCategorySheet = ({
  ref,
  onSelect,
  onDismiss,
}: {
  ref: RefObject<BottomSheetModal | null>;
  onSelect: (aisle: AisleCategory) => void;
  onDismiss?: () => void;
}) => {
  const windowDimensions = useWindowDimensions();

  return (
    <BaseSheet
      ref={ref}
      backdropDismissBehavior="dismissAll"
      snapPoints={['60%']}
      maxDynamicContentSize={windowDimensions.height * 0.9}
      onDismiss={onDismiss}
    >
      <CategoryContent onSelect={onSelect} />
    </BaseSheet>
  );
};

const styles = StyleSheet.create({
  header: {
    marginBottom: 12,
    color: '#4A3E36',
    fontFamily: 'Satoshi-Bold',
    fontSize: 20,
    lineHeight: 20 * 1.25,
  },
});
