import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useCallback } from 'react';
import { Provider } from 'jotai';
import { useGenerationDraftStore, useGenerationProductDraft, useGenerationSubmission } from '@/hooks/use-generation-draft';
import { GenerationGroceryItem, GROCERY_LAYOUT_TRANSITION } from '@/components/generation-grocery-item';
import { DashedDivider } from '@/components/dashed-divider';
import { AISLE_CATEGORIES, AisleHeader } from '@/components/aisle-header';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GroceryPreviewDTO, GroceryPreviewProductRowDTO } from '@/api/types';
import { useGroceryPreview } from '@/api/groceries';
import { parseISO } from '@/date-tools';
import { Typography } from '@/components/Typography';
import { Button } from '@/components/button';
import { colors } from '@/constants/colors';
import { RecipeMealIcon } from '@/components/recipe-meal-icon';
import { BellRing, ChevronLeft, ShoppingBasket, WandSparkles } from 'lucide-react-native';
import { format } from 'date-fns';
import { groupBy, isEmptyish } from 'remeda';
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

const ProductRow = ({ productRow, previewRecipes, description }: {
  productRow: GroceryPreviewProductRowDTO;
  previewRecipes: GroceryPreviewDTO['recipes'];
  description: string;
}) => {
  const { checked, override, toggle, setQuantity, setEditing } = useGenerationProductDraft(productRow.product_id);
  return (
    <View style={{ opacity: checked ? 1 : 0.55 }}>
      <GenerationGroceryItem
        product={productRow.product} purchase={productRow.purchase}
        quantity={override === null ? productRow.purchase?.suggested_quantity ?? productRow.quantity : override ?? productRow.quantity}
        overridden={override === undefined ? productRow.quantity_overridden : override !== null}
        onChange={setQuantity} onEditingChange={setEditing}
        checked={checked} checkboxLabel={`${productRow.product.name}, ${checked ? 'included' : 'excluded'}`}
        onToggle={toggle} recipes={productRow.recipes.map((recipe) => ({ ...recipe,
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
  getDescription: (productRow: GroceryPreviewProductRowDTO) => string;
};

const ProductSection = ({
  groupByCategory = true,
  title,
  description,
  icon: Icon,
  products,
  previewRecipes,
  getDescription,
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
          <Animated.View layout={GROCERY_LAYOUT_TRANSITION} key={aisle ?? 'reminders'} style={{ gap: 12 }}>
            {aisle && <AisleHeader type={aisle} />}
            <Animated.View
              layout={GROCERY_LAYOUT_TRANSITION}
              style={{ backgroundColor: colors.surface.raised, borderWidth: 1, borderBottomWidth: 2,
                borderColor: colors.brown[900], borderRadius: 8, overflow: 'hidden' }}
            >
              {aisleProducts.map((productRow, index) => (
                <Animated.View layout={GROCERY_LAYOUT_TRANSITION} key={productRow.product_id} style={{ overflow: 'hidden' }}>
                  {index > 0 && <DashedDivider />}
                  <ProductRow
                    productRow={productRow}
                    previewRecipes={previewRecipes}
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

const GenerationReview = (props: ContentProps) => {
  const store = useGenerationDraftStore(props.preview);
  return <Provider store={store}><Content {...props} /></Provider>;
};

const Content = ({ preview, startDate, endDate }: ContentProps) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { submit, editing, saving, failed } = useGenerationSubmission({
    preview, start: startDate, end: endDate, onSuccess: () => router.back(),
  });

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

      {failed && <Typography variant="body-sm" weight="medium" color={colors.red[600]} style={{ paddingHorizontal: 20 }}>Could not add these items. Try again.</Typography>}
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
          getDescription={reminderDescription}
        />

        <ProductSection
          title="Shopping list"
          description="Tap the amount to change what you’ll buy."
          icon={ShoppingBasket}
          products={shoppingProducts}
          previewRecipes={preview.recipes}
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
          text={editing ? "Save the amount to continue" : "Add to groceries"}
          disabled={editing || saving}
          leftIcon={{ Icon: WandSparkles }}
          onPress={submit}
          isLoading={saving}
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

  return <GenerationReview key={`${startDate}:${endDate}`} preview={preview.data} startDate={startDate} endDate={endDate} />;
}
