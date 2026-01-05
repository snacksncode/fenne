import { AisleCategory } from '@/api/groceries';
import { AisleHeader } from '@/components/aisle-header';
import { BaseSheet } from '@/components/bottomSheets/base-sheet';
import { PressableWithHaptics } from '@/components/pressable-with-feedback';
import { Text } from '@/components/Text';
import useTimeout from '@/hooks/use-timeout';
import { SheetManager, SheetProps, ScrollView } from 'react-native-actions-sheet';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

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
  'other',
  'other',
  'other',
  'other',
  'other',
  'other',
  'other',
  'other',
  'other',
  'other',
];

export const SelectCategorySheet = (props: SheetProps<'select-category-sheet'>) => {
  const handleSelect = (aisle: AisleCategory) => {
    SheetManager.hide(props.sheetId, { payload: aisle });
  };

  return (
    <BaseSheet id={props.sheetId} snapPoints={[60]}>
      <ScrollView>
        <Text style={styles.header}>Select a category</Text>
        <View style={{ paddingBottom: 20 }}>
          {aisles.map((aisle) => (
            <PressableWithHaptics style={{ paddingVertical: 6 }} onPress={() => handleSelect(aisle)} key={aisle}>
              <AisleHeader type={aisle} />
            </PressableWithHaptics>
          ))}
        </View>
      </ScrollView>
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
