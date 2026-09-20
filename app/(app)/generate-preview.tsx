import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useCallback, useEffect, useState } from 'react';
import { GenerationGroceryItem, GROCERY_LAYOUT_TRANSITION } from '@/components/generation-grocery-item';
import { DashedDivider } from '@/components/dashed-divider';
import { AISLE_CATEGORIES, AisleHeader } from '@/components/aisle-header';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GroceryPreviewDTO, GroceryPreviewProductRowDTO } from '@/api/types';
import { useGenerateGroceryItems, useGroceryPreview } from '@/api/groceries';
import { parseISO } from '@/date-tools';
import { Typography } from '@/components/Typography';
import { Button } from '@/components/button';
import { colors } from '@/constants/colors';
import { RecipeMealIcon } from '@/components/recipe-meal-icon';
import { BellRing, ChevronLeft, ShoppingBasket, WandSparkles } from 'lucide-react-native';
import { format } from 'date-fns';
import { groupBy, isEmptyish } from 'remeda';
import { useAppForm } from '@/components/form/app-form';
import { z } from 'zod';
import Animated from 'react-native-reanimated';

const Count = ({ count }: { count: number }) => {
  return (
    <View
      style={{
        padding: 4,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 32,
        height: 32,
        backgroundColor: colors.orange[100],
        borderRadius: 8,
      }}
    >
      <Typography variant="body-sm" weight="black" color={colors.orange[600]}>
        x{count}
      </Typography>
    </View>
  );
};

// ─── IngredientRow ─────────────────────────────────────────────────────────────

type ProductRowProps = {
  productRow: GroceryPreviewProductRowDTO;
  previewRecipes: GroceryPreviewDTO['recipes'];
  isChecked: boolean;
  onToggle: (id: string) => void;
  description: string;
  override?: number | null;
  onPurchaseChange: (id: string, quantity: number | null) => void;
  onEditingChange: (id: string, editing: boolean) => void;
};

const ProductRow = ({ productRow, previewRecipes, isChecked, onToggle, description, override, onPurchaseChange, onEditingChange }: ProductRowProps) => {
  useEffect(() => () => onEditingChange(productRow.product_id, false), [productRow.product_id, onEditingChange]);
  return (
    <View style={{ opacity: isChecked ? 1 : 0.55 }}>
      <GenerationGroceryItem
        product={productRow.product} purchase={productRow.purchase}
        quantity={override === null ? productRow.purchase?.suggested_quantity ?? productRow.quantity : override ?? productRow.quantity}
        overridden={override === undefined ? productRow.quantity_overridden : override !== null}
        onChange={(quantity) => onPurchaseChange(productRow.product_id, quantity)}
        onEditingChange={(editing) => onEditingChange(productRow.product_id, editing)}
        checked={isChecked} checkboxLabel={`${productRow.product.name}, ${isChecked ? 'included' : 'excluded'}`}
        onToggle={() => onToggle(productRow.product_id)} recipes={productRow.recipes.map((recipe) => ({ ...recipe,
          meal_type: previewRecipes.find((included) => included.id === recipe.id)?.meal_type }))} reason={description}
      />
    </View>
  );
};

type ProductSectionProps = {
  groupByCategory?: boolean;
  title: string;
  description: string;
  icon: typeof BellRing;
  products: GroceryPreviewProductRowDTO[];
  previewRecipes: GroceryPreviewDTO['recipes'];
  selectedProductIds: Set<string>;
  onToggle: (id: string) => void;
  getDescription: (productRow: GroceryPreviewProductRowDTO) => string;
  overrides: Record<string, number | null>;
  onPurchaseChange: (id: string, quantity: number | null) => void;
  onEditingChange: (id: string, editing: boolean) => void;
};

const ProductSection = ({
  groupByCategory = true,
  title,
  description,
  icon: Icon,
  products,
  previewRecipes,
  selectedProductIds,
  onToggle,
  getDescription, overrides, onPurchaseChange, onEditingChange,
}: ProductSectionProps) => {
  if (isEmptyish(products)) return null;
  const productsByAisle = groupBy(products, (row) => row.product.aisle);
  const groups = groupByCategory
    ? AISLE_CATEGORIES.map((aisle) => ({ aisle, products: productsByAisle[aisle] ?? [] }))
      .filter((group) => group.products.length > 0)
    : [{ aisle: null, products }];

  return (
    <Animated.View layout={GROCERY_LAYOUT_TRANSITION} style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Icon size={22} color={colors.brown[800]} />
        <Typography variant="heading-sm" weight="bold" color={colors.brown[800]}>
          {title}
        </Typography>
      </View>
      <Typography variant="body-sm" weight="medium" color={colors.brown[800]}>
        {description}
      </Typography>
      <View style={{ gap: 32, marginTop: 8 }}>
        {groups.map(({ aisle, products: aisleProducts }) => (

            <Animated.View layout={GROCERY_LAYOUT_TRANSITION} key={aisle ?? "reminders"} style={{ gap: 12 }}>
              {aisle && <AisleHeader type={aisle} />}
              <Animated.View layout={GROCERY_LAYOUT_TRANSITION} style={{ backgroundColor: colors.surface.raised, borderWidth: 1, borderBottomWidth: 2,
                borderColor: colors.brown[900], borderRadius: 8, overflow: 'hidden' }}>
                {aisleProducts.map((productRow, index) => (
                  <Animated.View layout={GROCERY_LAYOUT_TRANSITION} key={productRow.product_id} style={{ overflow: 'hidden' }}>
                    {index > 0 && <DashedDivider />}
                    <ProductRow
                      productRow={productRow}
                      previewRecipes={previewRecipes}
                      override={overrides[productRow.product_id]}
                      onPurchaseChange={onPurchaseChange}
                      onEditingChange={onEditingChange}
                      isChecked={selectedProductIds.has(productRow.product_id)}
                      onToggle={onToggle}
                      description={getDescription(productRow)}
                    />
                  </Animated.View>
                ))}
              </Animated.View>
            </Animated.View>
        ))}
      </View>
    </Animated.View>
  );
};

const recipeDescription = (productRow: GroceryPreviewProductRowDTO) =>
  productRow.recipes.map((recipe) => recipe.name).join(', ');

const reminderDescription = (productRow: GroceryPreviewProductRowDTO) => {
  const value = productRow.product.reminder_frequency_value;
  const unit = productRow.product.reminder_frequency_unit;
  const recipes = recipeDescription(productRow);
  const reminder = value != null && unit != null ? `Reminder every ${value} ${unit}` : 'Restock reminder';

  return [reminder, recipes].filter(Boolean).join(' · ');
};

type ContentProps = {
  preview: GroceryPreviewDTO;
  startDate: string;
  endDate: string;
};

const groceryGenerationSchema = z.object({
  checked_product_ids: z.array(z.string()),
});

const Content = ({ preview, startDate, endDate }: ContentProps) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const generateGroceryItems = useGenerateGroceryItems();
  const [editingIds, setEditingIds] = useState<Set<string>>(new Set());
  const onEditingChange = useCallback((id: string, editing: boolean) => setEditingIds((current) => {
    if (current.has(id) === editing) return current;
    const next = new Set(current);
    if (editing) next.add(id); else next.delete(id);
    return next;
  }), []);
  const [overrides, setOverrides] = useState<Record<string, number | null>>({});
  const onPurchaseChange = (id: string, quantity: number | null) => setOverrides((current) => ({ ...current, [id]: quantity }));
  const form = useAppForm({
    defaultValues: {
      checked_product_ids: preview.products.filter((product) => product.checked).map((product) => product.product_id),
    },
    validators: {
      onSubmit: groceryGenerationSchema,
    },
    onSubmit: ({ value }) => {
      generateGroceryItems.mutate(
        { start: startDate, end: endDate, checked_product_ids: value.checked_product_ids, purchase_quantities: Object.entries(overrides).filter(([id]) => value.checked_product_ids.includes(id)).map(([product_id, quantity]) => ({ product_id, quantity })) },
        { onSuccess: () => router.back() }
      );
    },
  });

  const toggleProduct = (productId: string) => {
    const current = form.state.values.checked_product_ids;
    const next = current.includes(productId)
      ? current.filter((selectedId) => selectedId !== productId)
      : [...current, productId];
    form.setFieldValue('checked_product_ids', next);
  };

  const reminderProducts = preview.products.filter(
    (productRow) => productRow.running_low || productRow.product.shape === 'timed'
  );
  const shoppingProducts = preview.products.filter(
    (productRow) => !(productRow.running_low || productRow.product.shape === 'timed')
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface.canvas }}>
      {/* Header */}
      <View style={{ paddingTop: insets.top, paddingHorizontal: 20, paddingBottom: 8 }}>
        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          onPress={() => router.back()}
          style={{ marginLeft: -8, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}
        >
          <ChevronLeft color={colors.brown[900]} />
          <Typography variant="heading-sm" weight="bold">
            Groceries
          </Typography>
        </Pressable>
        <Typography variant="heading-sm" weight="bold">
          Review groceries
        </Typography>
        <Typography variant="body-base" weight="regular" color={colors.brown[800]}>
          {format(parseISO(startDate), 'EEEE, MMM d')} – {format(parseISO(endDate), 'EEEE, MMM d')}
        </Typography>
      </View>

      {generateGroceryItems.isError && <Typography variant="body-sm" weight="medium" color={colors.red[600]} style={{ paddingHorizontal: 20 }}>Could not add these items. Try again.</Typography>}
      <form.AppForm>
        <form.Subscribe selector={(state) => state.values.checked_product_ids}>
          {(checkedProductIds) => {
            const selectedProductIds = new Set(checkedProductIds);

            return (
              <KeyboardAwareScrollView
                bottomOffset={120}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                  paddingHorizontal: 20,
                  paddingTop: 16,
                  gap: 32,
                  paddingBottom: insets.bottom + 100,
                }}
              >
                <ProductSection
                  title="Do you have these?"
                  groupByCategory={false}
                  description="Select any reminders you want to add."
                  icon={BellRing}
                  products={reminderProducts}
                  previewRecipes={preview.recipes}
                  selectedProductIds={selectedProductIds}
                  onToggle={toggleProduct}
                  overrides={overrides}
                  onPurchaseChange={onPurchaseChange}
                  onEditingChange={onEditingChange}
                  getDescription={reminderDescription}
                />

                <ProductSection
                  title="Shopping list"
                  description="Tap the amount to change what you’ll buy."
                  icon={ShoppingBasket}
                  products={shoppingProducts}
                  previewRecipes={preview.recipes}
                  selectedProductIds={selectedProductIds}
                  onToggle={toggleProduct}
                  overrides={overrides}
                  onPurchaseChange={onPurchaseChange}
                  onEditingChange={onEditingChange}
                  getDescription={recipeDescription}
                />

                {isEmptyish(preview.products) && (
                  <View
                    style={{
                      backgroundColor: colors.surface.raised,
                      borderWidth: 1,
                      borderBottomWidth: 2,
                      borderColor: colors.brown[900],
                      borderRadius: 8,
                      padding: 20,
                      gap: 4,
                    }}
                  >
                    <Typography variant="body-base" weight="bold" color={colors.brown[900]}>
                      Nothing to add
                    </Typography>
                    <Typography variant="body-sm" weight="medium" color={colors.brown[800]}>
                      The scheduled meals are covered by kitchen basics or pantry stock.
                    </Typography>
                  </View>
                )}

                {!isEmptyish(preview.recipes) && (
                  <View style={{ gap: 8 }}>
                    <Typography variant="heading-sm" weight="bold" color={colors.brown[800]}>
                      Meals included
                    </Typography>
                    {preview.recipes.map((recipe) => (
                      <View key={recipe.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <RecipeMealIcon mealType={recipe.meal_type} />
                        <Typography variant="body-base" weight="bold" color={colors.brown[900]} style={{ flex: 1 }}>
                          {recipe.name}
                        </Typography>
                        {recipe.amount > 1 && <Count count={recipe.amount} />}
                      </View>
                    ))}
                  </View>
                )}
              </KeyboardAwareScrollView>
            );
          }}
        </form.Subscribe>
      </form.AppForm>

      {/* Bottom button */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom,
          paddingTop: 12,
          backgroundColor: colors.surface.canvas,
          borderTopWidth: 1,
          borderColor: colors.brown[800],
        }}
      >
        <Button
          variant="primary"
          text={editingIds.size > 0 ? "Save the amount to continue" : "Add to groceries"}
          disabled={editingIds.size > 0}
          leftIcon={{ Icon: WandSparkles }}
          onPress={() => form.handleSubmit()}
          isLoading={generateGroceryItems.isPending}
        />
      </View>
    </View>
  );
};

export default function GeneratePreview() {
  const { startDate, endDate } = useLocalSearchParams<{ startDate: string; endDate: string }>();
  const preview = useGroceryPreview({ start: startDate, end: endDate });
  const { refetch } = preview;
  useFocusEffect(useCallback(() => { void refetch(); }, [refetch]));

  if (preview.isError && preview.data == null) {
    return <View style={{ flex: 1, padding: 24, justifyContent: 'center', gap: 12 }}>
      <Typography variant="body-base" weight="medium">Could not load the shopping list.</Typography>
      <Button text="Try again" variant="primary" onPress={() => { void preview.refetch(); }} />
    </View>;
  }
  if (preview.data == null) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface.canvas, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="small" color={colors.brown[900]} />
      </View>
    );
  }

  return <Content preview={preview.data} startDate={startDate} endDate={endDate} />;
}
