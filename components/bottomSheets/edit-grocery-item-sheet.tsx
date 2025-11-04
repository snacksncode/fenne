import { GroceryItemDTO } from '@/app/(tabs)/groceries';
import { BaseSheet } from '@/components/bottomSheets/base-sheet';
import { Text } from '@/components/Text';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { RefObject } from 'react';
import { StyleSheet } from 'react-native';

export type EditGroceryItemSheetData = { item: GroceryItemDTO };

type SheetProps = {
  ref: RefObject<BottomSheetModal<EditGroceryItemSheetData> | null>;
};

export const EditGroceryItemSheet = ({ ref }: SheetProps) => {
  return (
    <BaseSheet<EditGroceryItemSheetData> ref={ref}>
      {({ data }) => (
        <BaseSheet.Container>
          <Text style={styles.header}>
            <Text style={{ backgroundColor: '#F5D2BB' }}>&ldquo;{data?.item.name}&rdquo;</Text>
            {'\n'}
            {'\n'}
            <Text style={{ fontSize: 16 }}>
              Here there will be options to edit the name, quantity, category and maybe sth else
            </Text>
          </Text>
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
});
