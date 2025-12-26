import { GroceryItemDTO, useEditGroceryItem } from '@/api/groceries';
import { AisleHeader } from '@/components/aisle-header';
import { BaseSheet } from '@/components/bottomSheets/base-sheet';
import { SelectCategorySheet } from '@/components/bottomSheets/select-category-sheet';
import { Button } from '@/components/button';
import { SheetTextInput } from '@/components/input';
import { PressableWithHaptics } from '@/components/pressable-with-feedback';
import { Text } from '@/components/Text';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { ArrowRight } from 'lucide-react-native';
import { RefObject, useRef, useState } from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';

export type EditGroceryItemSheetData = { item: GroceryItemDTO };

type SheetProps = {
  ref: RefObject<BottomSheetModal<EditGroceryItemSheetData> | null>;
};

const Content = ({
  item: initialItem,
  sheetRef,
  onOpenCategorySheet,
}: {
  item: GroceryItemDTO;
  sheetRef: SheetProps['ref'];
  onOpenCategorySheet: (item: GroceryItemDTO) => void;
}) => {
  const [item, setItem] = useState<GroceryItemDTO>(initialItem);
  const editGroceryItem = useEditGroceryItem();

  const handleSave = () => {
    Keyboard.dismiss();
    editGroceryItem.mutate({ id: item.id, name: item.name, aisle: item.aisle });
    sheetRef.current?.dismiss();
  };

  return (
    <BaseSheet.Container>
      <Text style={styles.header}>Edit Item</Text>
      <View style={{ gap: 16 }}>
        <View>
          <Text style={styles.label}>Name</Text>
          <SheetTextInput
            value={item.name}
            onChangeText={(name) => setItem((prev) => ({ ...prev, name }))}
            placeholder="e.g. Avocado Toast"
          />
        </View>
        <View>
          <Text style={styles.label}>Category</Text>
          <PressableWithHaptics
            onPress={() => {
              Keyboard.dismiss();
              onOpenCategorySheet(item);
            }}
          >
            <AisleHeader type={item.aisle} />
          </PressableWithHaptics>
        </View>
      </View>
      <View style={{ marginTop: 32 }}>
        <Button text="Save changes" variant="primary" rightIcon={{ Icon: ArrowRight }} onPress={handleSave} />
      </View>
    </BaseSheet.Container>
  );
};

export const EditGroceryItemSheet = ({ ref }: SheetProps) => {
  const groceryItemTempStorage = useRef<GroceryItemDTO>(null);
  const selectCategorySheetRef = useRef<BottomSheetModal>(null);

  return (
    <>
      <BaseSheet<EditGroceryItemSheetData> ref={ref}>
        {({ data }) => (
          <Content
            item={data!.item}
            sheetRef={ref}
            onOpenCategorySheet={(item) => {
              ref.current?.dismiss();
              groceryItemTempStorage.current = item;
              selectCategorySheetRef.current?.present();
            }}
          />
        )}
      </BaseSheet>
      <SelectCategorySheet
        ref={selectCategorySheetRef}
        onSelect={(aisle) => {
          selectCategorySheetRef.current?.dismiss();
          ref.current?.present({ item: { ...groceryItemTempStorage.current!, aisle } });
        }}
      />
    </>
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
  label: {
    marginBottom: 4,
    color: '#4A3E36',
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
    lineHeight: 14 * 1.5,
  },
});
