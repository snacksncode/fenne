import { ProductSearchContext, useProductSuggestions } from '@/api/products';
import { ProductDTO, ProductSuggestionDTO } from '@/api/types';
import { AisleIcon } from '@/components/aisle-header';
import { TextInput } from '@/components/input';
import { PressableWithHaptics } from '@/components/pressable-with-feedback';
import { Typography } from '@/components/Typography';
import { colors } from '@/constants/colors';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { Plus, Search } from 'lucide-react-native';
import { ComponentProps } from 'react';
import { ScrollView, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

export type ProductChoice =
  | { kind: 'product'; product: ProductDTO }
  | { kind: 'suggestion'; suggestion: ProductSuggestionDTO }
  | { kind: 'custom'; name: string };

type EmptyCopy = {
  idleTitle: string;
  idleDescription: string;
  loadingDescription: string;
  emptyTitle: string;
  emptyDescription: string;
};

const EMPTY_COPY: Record<ProductSearchContext, EmptyCopy> = {
  shopping: {
    idleTitle: 'Search products',
    idleDescription: 'Start typing to find products and suggestions.',
    loadingDescription: 'Looking through products and suggestions.',
    emptyTitle: 'No matches found',
    emptyDescription: 'Continue to add this item manually.',
  },
  pantry: {
    idleTitle: 'Search products',
    idleDescription: 'Choose a tracked product to add it to the pantry.',
    loadingDescription: 'Looking through existing products.',
    emptyTitle: 'No existing product found',
    emptyDescription: 'Pantry stock can only be linked to products that already exist.',
  },
  recipe: {
    idleTitle: 'Search items',
    idleDescription: 'Start typing to find products and suggestions.',
    loadingDescription: 'Looking through products and suggestions.',
    emptyTitle: 'No matches found',
    emptyDescription: 'Add this item to define its product details.',
  },
};

type ProductSearchStepProps = {
  context: ProductSearchContext;
  query: string;
  onQueryChange: (query: string) => void;
  onSelect: (choice: ProductChoice) => void;
  inputStyle?: ComponentProps<typeof TextInput>['style'];
  listStyle?: StyleProp<ViewStyle>;
  listContentStyle?: StyleProp<ViewStyle>;
  productLabel?: (product: ProductDTO) => string;
  placeholder?: string;
  autoFocus?: boolean;
};

export const ProductSearchStep = ({
  context,
  query,
  onQueryChange,
  onSelect,
  inputStyle,
  listStyle,
  listContentStyle,
  productLabel = () => 'Existing item',
  placeholder = 'Search products',
  autoFocus,
}: ProductSearchStepProps) => {
  const trimmedQuery = query.trim();
  const debouncedQuery = useDebouncedValue(query, 250);
  const search = useProductSuggestions(debouncedQuery, context);
  const results = trimmedQuery.length > 0 ? (search.data?.results ?? []) : [];
  const showLoading = trimmedQuery.length > 0 && search.isFetching && results.length === 0;
  const showCustomRow = context === 'recipe' && trimmedQuery.length > 0 && search.data?.add_available === true;
  const showEmptyState = results.length === 0 && !showCustomRow;
  const copy = EMPTY_COPY[context];

  return (
    <View style={styles.container}>
      <TextInput
        value={query}
        onChangeText={onQueryChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        style={inputStyle}
      />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
        style={listStyle}
        contentContainerStyle={[styles.listContent, listContentStyle]}
      >
        {results.map((item) => (
          <PressableWithHaptics
            key={`${item.type}-${item.id}`}
            onPress={() =>
              item.type === 'product'
                ? onSelect({ kind: 'product', product: item })
                : onSelect({ kind: 'suggestion', suggestion: item })
            }
            scaleTo={0.98}
          >
            <View style={styles.option}>
              <AisleIcon type={item.aisle} />
              <View style={{ flex: 1 }}>
                <Typography variant="body-base" weight="bold" color={colors.brown[900]} numberOfLines={1}>
                  {item.name}
                </Typography>
                <Typography variant="body-xs" weight="regular" color={colors.brown[700]} style={{ marginTop: -4 }}>
                  {item.type === 'product' ? productLabel(item) : 'Suggested'}
                </Typography>
              </View>
            </View>
          </PressableWithHaptics>
        ))}
        {showCustomRow && (
          <PressableWithHaptics onPress={() => onSelect({ kind: 'custom', name: trimmedQuery })} scaleTo={0.98}>
            <View style={styles.option}>
              <Plus size={24} color={colors.brown[900]} />
              <Typography variant="body-base" weight="bold" color={colors.brown[900]}>
                Add &ldquo;{trimmedQuery}&rdquo;
              </Typography>
            </View>
          </PressableWithHaptics>
        )}
        {showEmptyState && (
          <View style={styles.emptyState}>
            <Search size={24} color={colors.brown[700]} strokeWidth={2.4} />
            <Typography variant="body-sm" weight="bold" color={colors.brown[900]}>
              {showLoading ? 'Searching...' : trimmedQuery ? copy.emptyTitle : copy.idleTitle}
            </Typography>
            <Typography variant="body-xs" weight="regular" color={colors.brown[700]} style={styles.emptyText}>
              {showLoading ? copy.loadingDescription : trimmedQuery ? copy.emptyDescription : copy.idleDescription}
            </Typography>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  listContent: {
    gap: 4,
  },
  option: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 4,
  },
  emptyState: {
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  emptyText: {
    textAlign: 'center',
  },
});
