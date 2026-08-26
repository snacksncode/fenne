import { AisleCategory } from '@/api/types';
import { AISLE_CATEGORIES, AisleHeader } from '@/components/aisle-header';
import { BaseSheet } from '@/components/bottomSheets/base-sheet';
import { PressableWithHaptics } from '@/components/pressable-with-feedback';
import { Typography } from '@/components/Typography';
import { SheetProps, useSheets } from '@/lib/sheet-context';
import { View } from 'react-native';

export const SelectCategorySheet = (props: SheetProps<'select-category-sheet'>) => {
  const sheets = useSheets();
  const handleSelect = (aisle: AisleCategory) => {
    sheets.dismiss(props.sheetId, aisle);
  };

  return (
    <BaseSheet
      id={props.sheetId}
      sizing={{ type: 'scrollable', detents: [0.6, 1] }}
      scrollableOptions={{ scrollingExpandsSheet: true }}
    >
      <Typography variant="heading-sm" weight="bold" style={{ marginBottom: 12 }}>
        Select a category
      </Typography>
      <View style={{ paddingBottom: 20 }}>
        {AISLE_CATEGORIES.map((aisle) => (
          <PressableWithHaptics style={{ paddingVertical: 6 }} onPress={() => handleSelect(aisle)} key={aisle}>
            <AisleHeader type={aisle} />
          </PressableWithHaptics>
        ))}
      </View>
    </BaseSheet>
  );
};
