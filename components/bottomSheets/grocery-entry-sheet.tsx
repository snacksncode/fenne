import { useEditGroceryItem, useGroceries } from '@/api/groceries';
import { BaseSheet, SHEET_FOOTER_HEIGHT } from '@/components/bottomSheets/base-sheet';
import { Button } from '@/components/button';
import { GroceryRecipeList } from '@/components/grocery-recipe-list';
import { PurchasePackSelector } from '@/components/purchase-pack-selector';
import { usePurchaseQuantity } from '@/hooks/use-purchase-quantity';
import { useStore } from '@tanstack/react-form';
import { PurchaseCalculations } from '@/components/purchase-calculations';
import { ShoppingItemIdentity } from '@/components/shopping-item-identity';
import { Typography } from '@/components/Typography';
import { colors } from '@/constants/colors';
import { SheetProps, useSheets } from '@/lib/sheet-context';
import { useRouter } from 'expo-router';
import { CookingPot, Pen } from 'lucide-react-native';
import { useEffect } from 'react';
import { Keyboard, StyleSheet, useWindowDimensions, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const GroceryEntrySheet = ({ sheetId, data }: SheetProps<'grocery-entry-sheet'>) => {
  const groceries = useGroceries();
  const edit = useEditGroceryItem();
  const sheets = useSheets();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const { refetch } = groceries;
  useEffect(() => { void refetch(); }, [refetch]);
  const item = groceries.data?.find((item) => item.id === data.grocery.id) ?? data.grocery;
  const removed = groceries.data != null && !groceries.data.some((entry) => entry.id === data.grocery.id);
  const openRecipe = async (id: string) => {
    Keyboard.dismiss();
    await sheets.dismiss(sheetId);
    router.push({ pathname: '/recipe/[id]', params: { id } });
  };
  const editProduct = async () => {
    if (!item.product) return;
    Keyboard.dismiss();
    await sheets.dismiss(sheetId);
    sheets.present('product-edit-sheet', { data: { product: item.product } });
  };

  const { form, feedback, counts, changePack, resetPacks } = usePurchaseQuantity({
    quantity: item.quantity,
    purchase: item.purchase,
    overridden: item.quantity_overridden,
    onSave: async (quantity) => {
      if (removed) return;
      await edit.mutateAsync({ id: item.id, quantity });
      Keyboard.dismiss();
      await sheets.dismiss(sheetId);
    },
  });
  const saving = useStore(form.store, (state) => state.isSubmitting);

  return (
    <form.AppForm>
      <BaseSheet id={sheetId} sizing={{ type: 'auto' }} dismissible={!saving} draggable={!saving}
        footer={!removed && <form.SubmitButton text="Save" variant="primary" disabled={saving} />}>
        <View style={styles.header}>
          <ShoppingItemIdentity name={item.name} aisle={item.aisle} style={{ flex: 1 }} />
          {item.product && <Button accessibilityLabel="Edit shopping item" variant="outlined" size="small"
            leftIcon={{ Icon: Pen }} onPress={editProduct} disabled={saving} style={styles.editButton} />}
        </View>
        <KeyboardAwareScrollView ref={feedback.scrollRef} style={{ flexGrow: 0, maxHeight: windowHeight * 0.55 }}
          bottomOffset={SHEET_FOOTER_HEIGHT + insets.bottom} keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View ref={feedback.contentRef} style={styles.content}>
            {removed ? <Typography variant="body-sm" weight="medium">This item is no longer on your list.</Typography> : <>
              <form.AppField name="quantity">{(field) => (
                <field.InlineQuantityField ref={feedback.inputRef('quantity')} label="Amount to buy" unit={item.unit}
                  editable={!saving} onValueChange={resetPacks}
                  accessibilityLabel={`Amount of ${item.name} to buy in ${item.unit === 'count' ? 'items' : item.unit}`} />
              )}</form.AppField>
              {!!item.product?.pack_sizes?.length && <Typography variant="body-sm" weight="bold">Packs</Typography>}
              <PurchasePackSelector sizes={item.product?.pack_sizes ?? []} unit={item.unit} counts={counts}
                onChange={changePack} disabled={saving} />
              <form.Error message={feedback.error} />
            </>}
            {item.purchase && <PurchaseCalculations purchase={item.purchase} unit={item.unit} />}
            <View style={styles.recipes}>
              <Typography variant="body-sm" weight="bold">Recipes</Typography>
              {item.recipes.length > 0 ? <GroceryRecipeList recipes={item.recipes} onPress={openRecipe} /> : (
                <View style={styles.emptyRecipes}>
                  <View style={styles.emptyIcon}><CookingPot size={24} color={colors.orange[600]} /></View>
                  <View style={styles.emptyCopy}>
                    <Typography variant="body-sm" weight="bold" color={colors.brown[900]}>
                      {item.source === 'manual' ? 'Added directly' : 'No linked recipes'}
                    </Typography>
                    <Typography variant="body-xs" weight="medium" color={colors.brown[800]}>
                      {item.source === 'manual' ? 'This shopping item was added without a recipe.' : 'This shopping item is no longer linked to a recipe.'}
                    </Typography>
                  </View>
                </View>
              )}
            </View>
          </View>
        </KeyboardAwareScrollView>
      </BaseSheet>
    </form.AppForm>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  editButton: { paddingHorizontal: 0, width: 42 },
  content: { gap: 20 },
  recipes: { gap: 10 },
  emptyRecipes: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 12, borderWidth: 1, borderBottomWidth: 2, borderColor: colors.border.strong, backgroundColor: colors.cream[50] },
  emptyIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: `${colors.orange[500]}20` },
  emptyCopy: { flex: 1, minWidth: 0, gap: 3 },
});
