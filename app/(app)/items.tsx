import { useProducts } from '@/api/products';
import { ProductDTO } from '@/api/types';
import { AisleIcon } from '@/components/aisle-header';
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
import { Pressable, StyleSheet, View } from 'react-native';
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
  <View style={styles.emptyContainer}>
    <View style={styles.emptyIcon}>
      <PackageSearch size={44} color={colors.cream[100]} strokeWidth={3} absoluteStrokeWidth />
    </View>
    <Typography variant="heading-md" weight="black" style={{ marginTop: 10, textAlign: 'center' }}>
      {search.trim() ? 'No products found' : 'No products yet'}
    </Typography>
    <Typography variant="body-sm" weight="medium" color={colors.brown[700]} style={styles.emptyText}>
      {search.trim() ? 'Try a different search.' : 'Products appear here as recipes and tracked groceries create them.'}
    </Typography>
  </View>
);

const Items = () => {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const products = useProducts();

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();

    return (products.data ?? [])
      .filter((product) => (query ? product.name.toLocaleLowerCase().includes(query) : true))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products.data, search]);

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerRow}>
          <Pressable hitSlop={20} onPress={() => router.back()}>
            <ChevronLeft color={colors.brown[900]} size={28} strokeWidth={2.25} />
          </Pressable>
          <Typography variant="heading-lg" weight="black">
            Items
          </Typography>
        </View>
        <TextInput value={search} onChangeText={setSearch} placeholder="Search items..." style={styles.searchInput} />
      </View>
      <FlashList
        data={filteredProducts}
        renderItem={({ item }) => <ProductRow product={item} />}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<EmptyCatalog search={search} />}
        style={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        contentContainerStyle={{
          ...(filteredProducts.length === 0 && { flexGrow: 1 }),
          paddingHorizontal: 20,
          paddingTop: insets.top + 140,
          paddingBottom: insets.bottom + 24,
        }}
      />
    </View>
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
    paddingBottom: 12,
    gap: 12,
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
    height: 44,
    borderRadius: 999,
    borderWidth: 2,
    borderBottomWidth: 3,
    color: colors.brown[900],
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyIcon: {
    backgroundColor: colors.brown[900],
    paddingHorizontal: 36,
    paddingVertical: 12,
    borderRadius: 999,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 4,
  },
});

export default Items;
