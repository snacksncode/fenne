import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GroceryPreviewDTO, GroceryPreviewProductRowDTO, MealType } from '@/api/types';
import { useGenerateGroceryItems, useGroceryPreview } from '@/api/groceries';
import { parseISO } from '@/date-tools';
import { Typography } from '@/components/Typography';
import { Button } from '@/components/button';
import { Checkbox, useCheckbox } from '@/components/checkbox';
import { scheduleOnUI } from 'react-native-worklets';
import { colors } from '@/constants/colors';
import { Pancake } from '@/components/svgs/pancake';
import { BellRing, ChevronLeft, ShoppingBasket, WandSparkles, Ham, Salad } from 'lucide-react-native';
import { format } from 'date-fns';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { isEmptyish } from 'remeda';
import { prettyUnit } from '@/utils/unit-formatters';
import { useAppForm } from '@/components/form/app-form';
import { z } from 'zod';

// ─── Recipe Icon ──────────────────────────────────────────────────────────────

const RecipeIcon = ({ mealType }: { mealType: MealType }) => {
  const iconProps = { color: '#CD7E34', size: 24 };
  return (
    <View style={{ padding: 4, backgroundColor: colors.orange[100], borderRadius: 8 }}>
      {mealType === 'breakfast' ? (
        <Pancake {...iconProps} />
      ) : mealType === 'lunch' ? (
        <Salad {...iconProps} />
      ) : (
        <Ham {...iconProps} />
      )}
    </View>
  );
};

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
      <Typography variant="body-sm" weight="black" color="#CD7E34">
        x{count}
      </Typography>
    </View>
  );
};

// ─── IngredientRow ─────────────────────────────────────────────────────────────

type ProductRowProps = {
  productRow: GroceryPreviewProductRowDTO;
  isChecked: boolean;
  onToggle: (id: string) => void;
  description: string;
};

const ProductRow = ({ productRow, isChecked, onToggle, description }: ProductRowProps) => {
  const { progress } = useCheckbox(isChecked);
  const scale = useSharedValue(1);
  const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const opacityStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0.4, 1]),
  }));

  return (
    <Animated.View style={opacityStyle}>
      <Pressable
        accessibilityLabel={`${productRow.product.name}, ${isChecked ? 'included' : 'excluded'}`}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isChecked }}
        onPressIn={() => scheduleOnUI(() => (scale.value = withSpring(0.9)))}
        onPressOut={() => scheduleOnUI(() => (scale.value = withSpring(1)))}
        onPress={() => onToggle(productRow.product_id)}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 }}
      >
        <Animated.View style={scaleStyle}>
          <Checkbox progress={progress} />
        </Animated.View>
        <View style={{ flex: 1, gap: 2 }}>
          <Typography variant="body-base" weight="bold" color={colors.brown[900]}>
            {productRow.product.name}
          </Typography>
          {description.length > 0 && (
            <Typography variant="body-sm" weight="medium" color={colors.brown[800]}>
              {description}
            </Typography>
          )}
        </View>
        {!(productRow.quantity === 1 && productRow.unit === 'count') && (
          <View
            style={{
              borderRadius: 999,
              height: 24,
              paddingHorizontal: 6,
              backgroundColor: colors.orange[500],
              borderWidth: 2,
              borderBottomWidth: 3,
              borderColor: colors.orange[600],
              justifyContent: 'center',
            }}
          >
            <Typography variant="body-sm" weight="bold" color={colors.cream[100]}>
              {productRow.quantity} {prettyUnit(productRow)}
            </Typography>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

type ProductSectionProps = {
  title: string;
  description: string;
  icon: typeof BellRing;
  products: GroceryPreviewProductRowDTO[];
  selectedProductIds: Set<string>;
  onToggle: (id: string) => void;
  getDescription: (productRow: GroceryPreviewProductRowDTO) => string;
};

const ProductSection = ({
  title,
  description,
  icon: Icon,
  products,
  selectedProductIds,
  onToggle,
  getDescription,
}: ProductSectionProps) => {
  if (isEmptyish(products)) return null;

  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Icon size={22} color={colors.brown[800]} />
        <Typography variant="heading-sm" weight="bold" color={colors.brown[800]}>
          {title}
        </Typography>
      </View>
      <Typography variant="body-sm" weight="medium" color={colors.brown[800]}>
        {description}
      </Typography>
      <View
        style={{
          backgroundColor: '#FEF2DD',
          borderWidth: 1,
          borderBottomWidth: 2,
          borderColor: colors.brown[900],
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        {products.map((productRow) => (
          <ProductRow
            key={productRow.product_id}
            productRow={productRow}
            isChecked={selectedProductIds.has(productRow.product_id)}
            onToggle={onToggle}
            description={getDescription(productRow)}
          />
        ))}
      </View>
    </View>
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
  const form = useAppForm({
    defaultValues: {
      checked_product_ids: preview.products.filter((product) => product.checked).map((product) => product.product_id),
    },
    validators: {
      onSubmit: groceryGenerationSchema,
    },
    onSubmit: ({ value }) => {
      generateGroceryItems.mutate(
        { start: startDate, end: endDate, checked_product_ids: value.checked_product_ids },
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
    <View style={{ flex: 1, backgroundColor: '#FEF7EA' }}>
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
          Review items
        </Typography>
        <Typography variant="body-base" weight="regular" color={colors.brown[800]}>
          {format(parseISO(startDate), 'EEEE, MMM d')} – {format(parseISO(endDate), 'EEEE, MMM d')}
        </Typography>
      </View>

      <form.AppForm>
        <form.Subscribe selector={(state) => state.values.checked_product_ids}>
          {(checkedProductIds) => {
            const selectedProductIds = new Set(checkedProductIds);

            return (
              <ScrollView
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
                  description="Restock reminders are optional. Check the ones you want added to this grocery list."
                  icon={BellRing}
                  products={reminderProducts}
                  selectedProductIds={selectedProductIds}
                  onToggle={toggleProduct}
                  getDescription={reminderDescription}
                />

                <ProductSection
                  title="Shopping list"
                  description="These are the product quantities needed for the scheduled meals."
                  icon={ShoppingBasket}
                  products={shoppingProducts}
                  selectedProductIds={selectedProductIds}
                  onToggle={toggleProduct}
                  getDescription={recipeDescription}
                />

                {isEmptyish(preview.products) && (
                  <View
                    style={{
                      backgroundColor: '#FEF2DD',
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
                        <RecipeIcon mealType={recipe.meal_type} />
                        <Typography variant="body-base" weight="bold" color={colors.brown[900]} style={{ flex: 1 }}>
                          {recipe.name}
                        </Typography>
                        {recipe.amount > 1 && <Count count={recipe.amount} />}
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>
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
          backgroundColor: '#FEF7EA',
          borderTopWidth: 1,
          borderColor: colors.brown[800],
        }}
      >
        <Button
          variant="primary"
          text="Generate"
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

  if (preview.data == null) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FEF7EA', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="small" color={colors.brown[900]} />
      </View>
    );
  }

  return <Content preview={preview.data} startDate={startDate} endDate={endDate} />;
}
