import { BaseSheet } from '@/components/bottomSheets/base-sheet';
import { Button } from '@/components/button';
import { GroceryQuantity } from '@/components/grocery-quantity';
import { PurchasePackSelector } from '@/components/purchase-pack-selector';
import { PressableWithHaptics } from '@/components/pressable-with-feedback';
import { Typography } from '@/components/Typography';
import { colors } from '@/constants/colors';
import { useGenerationAmounts } from '@/hooks/use-generation-amounts';
import { SheetProps, useSheets } from '@/lib/sheet-context';
import { useStore } from '@tanstack/react-form';
import { Archive, ChevronLeft, CookingPot, ShoppingBasket } from 'lucide-react-native';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

export const GenerationAmountsSheet = (props: SheetProps<'generation-amounts-sheet'>) => {
  const { sheetId, data: { product, purchase } } = props;
  const sheets = useSheets();
  const { form, feedback, ready, loadError, retry, buyingText, calculating, calculationError,
    counts, resetPacks, changePack } = useGenerationAmounts(props);
  const saving = useStore(form.store, (state) => state.isSubmitting);

  return (
    <form.AppForm>
      <BaseSheet id={sheetId} sizing={{ type: 'auto' }} dismissible={!saving} draggable={!saving}>
        <View style={styles.header}>
          <PressableWithHaptics accessibilityRole="button" accessibilityLabel="Cancel amount changes"
            disabled={saving} onPress={() => sheets.dismiss(sheetId, undefined)} hitSlop={8} style={{ paddingVertical: 8 }}>
            <ChevronLeft size={24} color={colors.brown[900]} />
          </PressableWithHaptics>
          <Typography variant="heading-sm" weight="bold" style={{ flex: 1 }}>{product.name}</Typography>
          <ShoppingBasket size={24} color={colors.brown[900]} />
        </View>
        {!ready ? loadError ? (
          <View style={styles.content}>
            <Typography variant="body-sm" weight="medium" color={colors.red[600]}>Could not load your pantry.</Typography>
            <Button text="Try again" variant="outlined" onPress={() => void retry()} />
          </View>
        ) : <ActivityIndicator color={colors.orange[600]} /> : (
          <KeyboardAwareScrollView ref={feedback.scrollRef} bottomOffset={24} keyboardShouldPersistTaps="handled"
            style={{ flexGrow: 0 }}>
            <View ref={feedback.contentRef} style={styles.content}>
              <View style={styles.need}>
                <View style={styles.label}>
                  <CookingPot size={18} color={colors.orange[600]} />
                  <Typography variant="body-sm" weight="medium" color={colors.orange[600]}>Recipes need</Typography>
                </View>
                <GroceryQuantity quantity={purchase.needed} unit={product.unit} />
              </View>
              <View style={styles.twins}>
                <View style={[styles.pill, styles.recipePill]}>
                  <View style={styles.label}>
                    <ShoppingBasket size={18} color={colors.orange[600]} />
                    <Typography variant="body-sm" weight="medium" color={colors.orange[600]}>Amount to buy</Typography>
                  </View>
                  <form.AppField name="quantity">{(field) => (
                    <field.InlineQuantityField ref={feedback.inputRef('quantity')} containerStyle={styles.input}
                      inputStyle={styles.inputText} fieldStyle={{ flex: 1, minWidth: 0 }} displayValue={buyingText}
                      editable={!saving} placeholder={calculating ? '…' : '0'} unit={product.unit === 'count' ? 'pcs' : product.unit}
                      accessibilityLabel={`Amount to buy for ${product.name} in ${product.unit === 'count' ? 'pieces' : product.unit}`}
                      onValueChange={resetPacks} />
                  )}</form.AppField>
                </View>
                <View style={[styles.pill, styles.pantryPill]}>
                  <View style={styles.label}>
                    <Archive size={18} color={colors.green[700]} />
                    <Typography variant="body-sm" weight="medium" color={colors.green[700]}>In pantry</Typography>
                  </View>
                  <form.AppField name="pantry">{(field) => (
                    <field.InlineQuantityField ref={feedback.inputRef('pantry')} containerStyle={styles.input}
                      inputStyle={styles.inputText} editable={!saving} tone="green" unit={product.unit === 'count' ? 'pcs' : product.unit}
                      accessibilityLabel={`In pantry for ${product.name} in ${product.unit === 'count' ? 'pieces' : product.unit}`} />
                  )}</form.AppField>
                </View>
              </View>
              {calculating && <Typography variant="body-xs" weight="medium" color={colors.brown[700]}>Updating amount to buy…</Typography>}
              {calculationError && <Typography variant="body-xs" weight="medium" color={colors.red[600]}>
                Could not update the calculation. Save to try again, or enter an amount to buy.
              </Typography>}
              <PurchasePackSelector sizes={product.pack_sizes ?? []} unit={product.unit} counts={counts}
                onChange={changePack} disabled={saving || calculating} />
              <form.Error message={feedback.error} />
              <form.SubmitButton text="Save amounts" variant="primary" disabled={saving} />
            </View>
          </KeyboardAwareScrollView>
        )}
      </BaseSheet>
    </form.AppForm>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  content: { gap: 20, paddingBottom: 8 },
  twins: { flexDirection: 'row', gap: 8 },
  pill: { flex: 1, minWidth: 0, borderRadius: 20, padding: 12, gap: 10 },
  recipePill: { backgroundColor: colors.orange[500] + '20' },
  pantryPill: { backgroundColor: colors.green[600] + '18' },
  need: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: 4, paddingVertical: 8 },
  input: { borderRadius: 16, paddingLeft: 12, paddingRight: 8 },
  inputText: { fontSize: 16, fontFamily: 'Satoshi-Bold', minWidth: 0 },
  label: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
});
