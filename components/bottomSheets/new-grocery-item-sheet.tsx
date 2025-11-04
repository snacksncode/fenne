import { AisleCategory, AisleHeader } from '@/components/aisle-header';
import { BaseSheet } from '@/components/bottomSheets/base-sheet';
import { Button } from '@/components/button';
import { SheetTextInput } from '@/components/input';
import { PressableWithHaptics } from '@/components/pressable-with-feedback';
import { Text } from '@/components/Text';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { ArrowRight } from 'lucide-react-native';
import { RefObject, useState } from 'react';
import { Keyboard, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type SelectCategorySheetData = {
  value: string;
};

type SheetProps = {
  ref: RefObject<BottomSheetModal | null>;
  onNext: (value: string) => void;
};

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

const Content = (props: { onNext: (value: string) => void }) => {
  const [value, setValue] = useState('');
  return (
    <BaseSheet.Container>
      <Text style={styles.header}>What&apos;s missing?</Text>
      <View style={{ gap: 16 }}>
        <View>
          <Text style={styles.label}>Name</Text>
          <SheetTextInput autoFocus value={value} onChangeText={setValue} placeholder="e.g. Avocado Toast" />
        </View>
      </View>
      <View style={{ marginTop: 32 }}>
        <Button
          text="Select category"
          variant="primary"
          rightIcon={{ Icon: ArrowRight, size: 16 }}
          onPress={() => {
            Keyboard.dismiss();
            return props.onNext(value);
          }}
        />
      </View>
    </BaseSheet.Container>
  );
};

export const NewGroceryItemSheet = ({ ref, onNext }: SheetProps) => (
  <BaseSheet ref={ref}>
    <Content onNext={onNext} />
  </BaseSheet>
);

export const SelectCategorySheet = ({
  ref,
  onSelect,
}: {
  ref: RefObject<BottomSheetModal | null>;
  onSelect: (name: string, aisle: AisleCategory) => void;
}) => {
  const insets = useSafeAreaInsets();
  const windowDimensions = useWindowDimensions();

  return (
    <BaseSheet<SelectCategorySheetData>
      ref={ref}
      backdropDismissBehavior="dismissAll"
      snapPoints={['60%']}
      maxDynamicContentSize={windowDimensions.height * 0.95}
    >
      {({ data }) => (
        <BottomSheetScrollView>
          <View style={{ paddingHorizontal: 20 }}>
            <Text style={styles.header}>Select a category</Text>
          </View>
          <View style={{ paddingHorizontal: 20, gap: 12, paddingBottom: insets.bottom }}>
            {aisles.map((aisle) => (
              <PressableWithHaptics onPress={() => onSelect(data?.value ?? '', aisle)} key={aisle}>
                <AisleHeader type={aisle} />
              </PressableWithHaptics>
            ))}
          </View>
        </BottomSheetScrollView>
      )}
    </BaseSheet>
  );
};

const styles = StyleSheet.create({
  header: {
    marginBottom: 16,
    color: '#4A3E36',
    fontFamily: 'Satoshi-Bold',
    fontSize: 20,
    lineHeight: 20 * 1.25,
  },
  label: {
    marginBottom: 4,
    color: '#4A3E36',
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
    lineHeight: 14 * 1.5,
  },
});
