import { useProducts } from '@/api/products';
import { ProductDTO } from '@/api/types';
import { AisleIcon } from '@/components/aisle-header';
import { EmptyState } from '@/components/empty-state';
import { TextInput } from '@/components/input';
import { PressableWithHaptics } from '@/components/pressable-with-feedback';
import { Typography } from '@/components/Typography';
import { colors } from '@/constants/colors';
import { useSheets } from '@/lib/sheet-context';
import { prettyUnit } from '@/utils/unit-formatters';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { ChevronLeft, PackageSearch } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const aisleLabels: Record<ProductDTO['aisle'], string> = {
  produce: 'Produce',
  bakery: 'Bakery',
  dairy_eggs: 'Dairy & Eggs',
  meat: 'Meat',
  seafood: 'Seafood',
  pantry: 'Pantry',
  frozen_foods: 'Frozen Foods',
  beverages: 'Beverages',
  snacks: 'Snacks',
  condiments_sauces: 'Condiments & Sauces',
  spices_baking: 'Spices & Baking',
  household: 'Household',
  personal_care: 'Personal Care',
  pet_supplies: 'Pet Supplies',
  other: 'Other',
};

const reminderSummary = (product: ProductDTO) => {
  if (!product.reminder_frequency_value || !product.reminder_frequency_unit) return 'restock reminder';
  const unit = product.reminder_frequency_unit;
  const suffix = product.reminder_frequency_value === 1 ? unit.replace(/s$/, '') : unit;

  return `restock every ${product.reminder_frequency_value} ${suffix}`;
};

const trackingSummary = (product: ProductDTO) => {
  if (product.is_kitchen_basic || product.shape === 'kitchen_basic') return 'kitchen basic';
  if (product.shape === 'timed') return reminderSummary(product);
  if (product.shape === 'measured' && product.quantity != null) {
    return `${product.quantity} ${prettyUnit({ quantity: product.quantity, unit: product.unit })}`;
  }
  if (product.shape === 'counted' && product.pack_count != null) {
    return `${product.pack_count} ${prettyUnit({ quantity: product.pack_count, unit: 'count' })} pack`;
  }

  return null;
};

const ProductRow = ({ product }: { product: ProductDTO }) => {
  const sheets = useSheets();
  const summary = trackingSummary(product);
  const secondary = summary ? `${aisleLabels[product.aisle]} · ${summary}` : aisleLabels[product.aisle];

  return (
    <PressableWithHaptics
      style={styles.row}
      scaleTo={0.98}
      onPress={() => sheets.present('product-edit-sheet', { data: { product } })}
      onLongPress={() => sheets.present('product-options-sheet', { data: { product } })}
    >
      <AisleIcon type={product.aisle} />
      <View style={{ flex: 1 }}>
        <Typography variant="body-lg" weight="bold" numberOfLines={1}>
          {product.name}
        </Typography>
        <Typography variant="body-sm" weight="regular" color={colors.brown[700]} numberOfLines={1}>
          {secondary}
        </Typography>
      </View>
    </PressableWithHaptics>
  );
};

const EmptyCatalog = ({ search }: { search: string }) => (
  <EmptyState
    icon={PackageSearch}
    title={search.trim() ? 'No products found' : 'No products yet'}
    description={
      search.trim() ? 'Try a different search.' : 'Products appear here as recipes and tracked groceries create them.'
    }
  />
);

const Items = () => {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const products = useProducts();
  const { height: keyboardHeight } = useReanimatedKeyboardAnimation();
  const toolbarStyle = useAnimatedStyle(() => ({ bottom: Math.max(insets.bottom, -keyboardHeight.value + 12) }));

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();

    return (products.data ?? [])
      .filter((product) => (query ? product.name.toLocaleLowerCase().includes(query) : true))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products.data, search]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.screen}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <View style={styles.headerRow}>
            <Pressable accessibilityLabel="Go back" accessibilityRole="button" hitSlop={20} onPress={() => router.back()}>
              <ChevronLeft color={colors.brown[900]} size={28} strokeWidth={2.25} />
            </Pressable>
            <Typography variant="heading-lg" weight="black">
              Items
            </Typography>
          </View>
        </View>
        <FlashList
          data={filteredProducts}
          renderItem={({ item }) => <ProductRow product={item} />}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={<EmptyCatalog search={search} />}
          style={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={{
            ...(filteredProducts.length === 0 && { flexGrow: 1 }),
            paddingHorizontal: 20,
            paddingTop: insets.top + 76,
            paddingBottom: insets.bottom + 64,
          }}
        />
        {(products.data ?? []).length > 0 ? (
          <Animated.View style={[styles.toolbar, toolbarStyle]}>
            <TextInput
              variant="search"
              value={search}
              onChangeText={setSearch}
              placeholder="Search items..."
              style={styles.searchInput}
            />
          </Animated.View>
        ) : null}
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cream[100],
  },
  header: {
    position: 'absolute',
    zIndex: 1,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    backgroundColor: colors.cream[100],
    borderBottomColor: colors.brown[900],
    borderBottomWidth: 1,
  },
  headerRow: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  searchInput: {
    flex: 1,
    color: colors.brown[900],
  },
  toolbar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  list: {
    flex: 1,
    backgroundColor: colors.cream[100],
  },
  row: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderBottomWidth: 2,
    borderColor: colors.brown[900],
    borderRadius: 8,
    backgroundColor: '#FEF2DD',
  },
});

export default Items;
