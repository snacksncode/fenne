import { ProductChoice, ProductSearchStep } from '@/components/product-search-step';

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
    placeholder="Search shopping items..."
    autoFocus
    listStyle={{ maxHeight: 240 }}
  />
);
