import { useEditGroceryItem, useGroceries } from '@/api/groceries';
import { AISLE_LABELS } from '@/components/aisle-header';
import { BaseSheet } from '@/components/bottomSheets/base-sheet';
import { GroceryRecipeList } from '@/components/grocery-recipe-list';
import { PurchaseAmountEditor } from '@/components/purchase-amount-editor';
import { PurchaseCalculations } from '@/components/purchase-calculations';
import { PressableWithHaptics } from '@/components/pressable-with-feedback';
import { Typography } from '@/components/Typography';
import { colors } from '@/constants/colors';
import { SheetProps, useSheets } from '@/lib/sheet-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, ShoppingBasket } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { Keyboard, View } from 'react-native';
import { KeyboardAwareScrollView, KeyboardAwareScrollViewRef } from 'react-native-keyboard-controller';

export const GroceryEntrySheet = ({ sheetId, data }: SheetProps<'grocery-entry-sheet'>) => {
  const groceries = useGroceries();
  const edit = useEditGroceryItem();
  const sheets = useSheets();
  const router = useRouter();
  const scrollRef = useRef<KeyboardAwareScrollViewRef>(null);
  const { refetch } = groceries;
  useEffect(() => { void refetch(); }, [refetch]);
  const item = groceries.data?.find((item) => item.id === data.grocery.id) ?? data.grocery;
  const removed = groceries.data != null && !groceries.data.some((entry) => entry.id === data.grocery.id);
  const openRecipe = async (id: string) => {
    Keyboard.dismiss();
    await sheets.dismiss(sheetId);
    router.push({ pathname: '/recipe/[id]', params: { id } });
  };

  return (
    <BaseSheet id={sheetId} sizing={{ type: 'scrollable', detents: [0.5, 1] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <PressableWithHaptics accessibilityRole="button" accessibilityLabel="Close grocery details"
          onPress={() => sheets.dismiss(sheetId)} hitSlop={8} style={{ paddingVertical: 8 }}>
          <ChevronLeft size={24} color={colors.brown[900]} />
        </PressableWithHaptics>
        <Typography variant="heading-sm" weight="bold" style={{ flex: 1 }}>{item.name}</Typography>
        <ShoppingBasket size={24} color={colors.brown[900]} />
      </View>
      <KeyboardAwareScrollView ref={scrollRef} bottomOffset={24} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={{ gap: 24, paddingBottom: 24 }}>
          <Typography variant="body-sm" weight="medium" color={colors.brown[700]}>{AISLE_LABELS[item.aisle]}</Typography>
          {removed ? <Typography variant="body-sm" weight="medium">This item is no longer on your list.</Typography> : (
            <PurchaseAmountEditor name={item.name} unit={item.unit} quantity={item.quantity}
              packSizes={item.product?.pack_sizes} purchase={item.purchase} overridden={item.quantity_overridden}
              onInvalid={() => requestAnimationFrame(() => scrollRef.current?.assureFocusedInputVisible())}
              onSave={async (quantity) => {
                await edit.mutateAsync({ id: item.id, quantity });
                Keyboard.dismiss();
                await sheets.dismiss(sheetId);
              }} />
          )}
          {item.purchase && <PurchaseCalculations purchase={item.purchase} unit={item.unit} />}
          <View style={{ gap: 12 }}>
            <Typography variant="heading-sm" weight="bold">Recipes</Typography>
            <GroceryRecipeList recipes={item.recipes} onPress={openRecipe}
              emptyMessage={item.source === 'manual' ? 'You added this item directly. No recipes are linked to it.' : undefined} />
          </View>
        </View>
      </KeyboardAwareScrollView>
    </BaseSheet>
  );
};
