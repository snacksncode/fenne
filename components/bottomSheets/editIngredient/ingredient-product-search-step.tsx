import { ProductChoice, ProductSearchStep } from '@/components/product-search-step';
import { StyleSheet } from 'react-native';

type IngredientProductSearchStepProps = {
  query: string;
  onQueryChange: (query: string) => void;
  onSelect: (choice: ProductChoice) => void;
};

export const IngredientProductSearchStep = ({ query, onQueryChange, onSelect }: IngredientProductSearchStepProps) => (
  <ProductSearchStep
    context="recipe"
    query={query}
    onQueryChange={onQueryChange}
    onSelect={onSelect}
    placeholder="Search items..."
    autoFocus
    inputStyle={styles.searchInput}
    listStyle={{ maxHeight: 240 }}
  />
);

const styles = StyleSheet.create({
  searchInput: {
    borderRadius: 999,
    borderWidth: 2,
    borderBottomWidth: 3,
  },
});
