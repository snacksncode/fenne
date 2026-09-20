import { APIError } from '@/api/client';
import { pantryOptions, useAddPantryEntry, useEditPantryEntry } from '@/api/pantry';
import { purchaseSuggestionOptions } from '@/api/products';
import { queryKeys } from '@/api/query-keys';
import { PantryEntryDTO } from '@/api/types';
import { BaseSheet } from '@/components/bottomSheets/base-sheet';
import { Button } from '@/components/button';
import { formErrorMessage, useAppForm } from '@/components/form/app-form';
import { GroceryQuantity, formatGroceryQuantity } from '@/components/grocery-quantity';
import { TextInputRef } from '@/components/input';
import { InlineQuantityInput } from '@/components/inline-quantity-input';
import { generationAmountsSchema, generationBuyingText, validGenerationAmount } from './generation-amounts-model';
import { PressableWithHaptics } from '@/components/pressable-with-feedback';
import { Typography } from '@/components/Typography';
import { colors } from '@/constants/colors';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { SheetProps, useSheets } from '@/lib/sheet-context';
import { parseLocaleFloat } from '@/utils';
import { useStore } from '@tanstack/react-form';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Archive, ChevronLeft, CookingPot, ShoppingBasket } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Keyboard, StyleSheet, View } from 'react-native';

const errorMessage = (value: unknown) => typeof value === 'string' ? value
  : Array.isArray(value) ? value.find((entry): entry is string => typeof entry === 'string') : undefined;

export const GenerationAmountsSheet = ({ sheetId, data }: SheetProps<'generation-amounts-sheet'>) => {
  const sheets = useSheets();
  const queryClient = useQueryClient();
  const [loaded, setLoaded] = useState<{ entry?: PantryEntryDTO }>();
  const [loadError, setLoadError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    setLoadError(false);
    void queryClient.fetchQuery({ ...pantryOptions, staleTime: 0 }).then((entries) => {
      if (active) setLoaded({ entry: entries.find((entry) => entry.product_id === data.product.id) });
    }).catch(() => { if (active) setLoadError(true); });
    return () => { active = false; };
  }, [queryClient, data.product.id, attempt]);

  return <BaseSheet id={sheetId} sizing={{ type: 'auto' }}
    dismissible={!saving} draggable={!saving}>
    <View style={styles.header}>
      <PressableWithHaptics accessibilityRole="button" accessibilityLabel="Cancel amount changes"
        disabled={saving} onPress={() => sheets.dismiss(sheetId, undefined)} hitSlop={8} style={{ paddingVertical: 8 }}>
        <ChevronLeft size={24} color={colors.brown[900]} />
      </PressableWithHaptics>
      <Typography variant="heading-sm" weight="bold" style={{ flex: 1 }}>{data.product.name}</Typography>
      <ShoppingBasket size={24} color={colors.brown[900]} />
    </View>
    {loaded ? <AmountsForm data={data} sheetId={sheetId} entry={loaded.entry} onSavingChange={setSaving} />
      : loadError ? <View style={styles.content}>
        <Typography variant="body-sm" weight="medium" color={colors.red[600]}>Could not load your pantry.</Typography>
        <Button text="Try again" variant="outlined" onPress={() => setAttempt((value) => value + 1)} />
      </View> : <ActivityIndicator color={colors.orange[600]} />}
  </BaseSheet>;
};

const AmountsForm = ({ data, sheetId, entry, onSavingChange }: SheetProps<'generation-amounts-sheet'> & {
  entry?: PantryEntryDTO; onSavingChange: (saving: boolean) => void;
}) => {
  const { product, purchase, quantity, overridden } = data;
  const sheets = useSheets();
  const queryClient = useQueryClient();
  const addPantry = useAddPantryEntry();
  const editPantry = useEditPantryEntry();
  const pantryRef = useRef<TextInputRef>(null);
  const buyingRef = useRef<TextInputRef>(null);
  const [packCounts, setPackCounts] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const initialPantry = entry?.quantity_remaining ?? 0;
  const focusField = (name: 'pantry' | 'quantity') => requestAnimationFrame(() => {
    (name === 'pantry' ? pantryRef : buyingRef).current?.focus();
  });
  const form = useAppForm({
    defaultValues: { pantry: String(initialPantry), quantity: overridden ? String(quantity) : null as string | null },
    validators: { onSubmit: generationAmountsSchema },
    onSubmitInvalid: ({ value }) => focusField(value.quantity !== null && !validGenerationAmount(value.quantity) ? 'quantity' : 'pantry'),
    onSubmit: async ({ value }) => {
      setError(null);
      onSavingChange(true);
      for (const name of ['pantry', 'quantity'] as const) {
        form.setFieldMeta(name, (meta) => ({ ...meta, errorMap: { ...meta.errorMap, onServer: undefined } }));
      }
      try {
        const pantry = parseLocaleFloat(value.pantry);
        // Resolve the exact draft before writing; rapid edits must not save an older calculation.
        if (value.quantity === null) {
          await queryClient.fetchQuery(purchaseSuggestionOptions(product.id, purchase.needed, pantry));
        }
        if (pantry !== initialPantry) {
          const entries = await queryClient.fetchQuery({ ...pantryOptions, staleTime: 0 });
          const current = entries.find((entry) => entry.product_id === product.id);
          if (current) await editPantry.mutateAsync({ id: current.id, quantity_remaining: pantry });
          else if (pantry > 0) await addPantry.mutateAsync({ product_id: product.id, quantity_remaining: pantry });
          await queryClient.invalidateQueries({ queryKey: queryKeys.groceries.previews() });
        }
        Keyboard.dismiss();
        await sheets.dismiss(sheetId, { quantity: value.quantity === null ? null : parseLocaleFloat(value.quantity) });
      } catch (caught) {
        const errors = caught instanceof APIError && caught.data && typeof caught.data === 'object'
          ? caught.data as Record<string, unknown> : {};
        const pantryError = errorMessage(errors.quantity_remaining) ?? errorMessage(errors.pantry);
        const quantityError = errorMessage(errors.quantity);
        for (const [name, message] of [['pantry', pantryError], ['quantity', quantityError]] as const) {
          if (message) form.setFieldMeta(name, (meta) => ({ ...meta, isTouched: true,
            errorMap: { ...meta.errorMap, onServer: message } }));
        }
        if (pantryError || quantityError) focusField(quantityError ? 'quantity' : 'pantry');
        else setError(errorMessage(errors.base) ?? errorMessage(errors.product) ?? 'Could not save amounts. Try again.');
      } finally {
        onSavingChange(false);
      }
    },
  });
  const pantryText = useStore(form.store, (state) => state.values.pantry);
  const buyingOverride = useStore(form.store, (state) => state.values.quantity);
  const manualBuying = buyingOverride !== null;
  const saving = useStore(form.store, (state) => state.isSubmitting);
  const debouncedPantry = useDebouncedValue(pantryText, 200);
  const projection = useQuery({
    ...purchaseSuggestionOptions(product.id, purchase.needed, parseLocaleFloat(debouncedPantry)),
    enabled: validGenerationAmount(debouncedPantry),
    retry: false,
  });
  const currentProjection = [projection.data, purchase].find((candidate) =>
    candidate?.pantry === parseLocaleFloat(pantryText) && candidate.needed === purchase.needed);
  const buyingText = generationBuyingText({ quantity: buyingOverride, pantry: pantryText,
    needed: purchase.needed, projection: currentProjection });
  const calculating = !manualBuying && validGenerationAmount(pantryText) && buyingText === undefined
    && (pantryText !== debouncedPantry || projection.isFetching);
  const counts: Record<string, number> = manualBuying ? packCounts
    : Object.fromEntries((currentProjection?.packs ?? []).map((pack) => [pack.size, pack.count]));
  const changePack = (size: number, delta: number) => {
    const next: Record<string, number> = { ...counts, [size]: Math.max(0, (counts[size] ?? 0) + delta) };
    setPackCounts(next);
    const total = Object.entries(next).reduce((sum, [pack, count]) => sum + Number(pack) * count, 0);
    form.setFieldValue('quantity', String(Number(total.toFixed(3))));
  };

  return <form.AppForm><View style={styles.content}>
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
          <form.AppField name="quantity">{(field) => <View style={{ flex: 1, minWidth: 0 }}>
            <InlineQuantityInput ref={buyingRef} containerStyle={styles.input} inputStyle={styles.inputText}
              value={buyingText ?? ''} editable={!saving} onBlur={field.handleBlur}
              placeholder={calculating ? '…' : '0'} unit={product.unit === 'count' ? 'pcs' : product.unit}
              accessibilityLabel={`Amount to buy for ${product.name} in ${product.unit === 'count' ? 'pieces' : product.unit}`}
              onChangeText={(text) => { setPackCounts({}); field.handleChange(text); }} />
            {field.state.meta.isTouched && field.state.meta.errors.length > 0 && <View accessible accessibilityRole="alert">
              <Typography variant="body-xs" weight="medium" color={colors.red[600]}>
                {formErrorMessage(field.state.meta.errors[0])}
              </Typography>
            </View>}
          </View>}</form.AppField>
        </View>
        <View style={[styles.pill, styles.pantryPill]}>
          <View style={styles.label}>
            <Archive size={18} color={colors.green[700]} />
            <Typography variant="body-sm" weight="medium" color={colors.green[700]}>In pantry</Typography>
          </View>
          <form.AppField name="pantry">{(field) => <>
            <InlineQuantityInput ref={pantryRef} containerStyle={styles.input} inputStyle={styles.inputText} tone="green"
              value={field.state.value} editable={!saving} onBlur={field.handleBlur}
              unit={product.unit === 'count' ? 'pcs' : product.unit}
              accessibilityLabel={`In pantry for ${product.name} in ${product.unit === 'count' ? 'pieces' : product.unit}`}
              onChangeText={field.handleChange} />
            {field.state.meta.isTouched && field.state.meta.errors.length > 0 && <View accessible accessibilityRole="alert">
              <Typography variant="body-xs" weight="medium" color={colors.red[600]}>
                {formErrorMessage(field.state.meta.errors[0])}
              </Typography>
            </View>}
          </>}</form.AppField>
        </View>
      </View>
      {!manualBuying && calculating && <Typography variant="body-xs" weight="medium" color={colors.brown[700]}>Updating amount to buy…</Typography>}
      {!manualBuying && buyingText === undefined && validGenerationAmount(pantryText) && projection.isError && <Typography variant="body-xs" weight="medium" color={colors.red[600]}>
        Could not update the calculation. Save to try again, or enter an amount to buy.
      </Typography>}
      {(product.pack_sizes ?? []).map((size) => <View key={size} style={styles.amount}>
        <Typography variant="body-sm" weight="medium" style={{ flex: 1 }}>{formatGroceryQuantity(size, product.unit)} pack</Typography>
        <Button text="−" size="small" variant="outlined" disabled={saving || !counts[size] || (!manualBuying && calculating)}
          accessibilityLabel={`Remove one ${formatGroceryQuantity(size, product.unit)} pack`} onPress={() => changePack(size, -1)} />
        <Typography variant="body-base" weight="bold">{counts[size] ?? 0}</Typography>
        <Button text="+" size="small" variant="outlined" disabled={saving || (!manualBuying && calculating)}
          accessibilityLabel={`Add one ${formatGroceryQuantity(size, product.unit)} pack`} onPress={() => changePack(size, 1)} />
      </View>)}
      {error && <View accessible accessibilityRole="alert"><Typography variant="body-sm" weight="medium" color={colors.red[600]}>{error}</Typography></View>}
      <Button text="Save amounts" variant="primary" isLoading={saving} disabled={saving} onPress={() => form.handleSubmit()} />
    </View></form.AppForm>;
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
  amount: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
