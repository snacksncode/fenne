import { ProductDTO } from '@/api/types';
import { useAppForm } from '@/components/form/app-form';
import { ProductChoice } from '@/components/product-search-step';
import { SheetProps, useSheets } from '@/lib/sheet-context';
import { Keyboard } from 'react-native';
import { useState } from 'react';
import {
  emptyIngredientForm,
  emptyProductForm,
  IngredientDetailsFormData,
  IngredientEditorPhase,
  ingredientFromProduct,
  ingredientSchema,
  productDraftFromForm,
  productDraftSchema,
  productFormFromDraft,
  ProductDraftForm,
  productFormFromQuery,
  productFormFromSuggestion,
  SelectedProduct,
} from './ingredient-editor-model';

type EditIngredientSheetData = SheetProps<'edit-ingredient-sheet'>['data'];

type UseIngredientEditorParams = {
  sheetId: SheetProps<'edit-ingredient-sheet'>['sheetId'];
  data: EditIngredientSheetData;
};

export const useIngredientEditor = ({ sheetId, data }: UseIngredientEditorParams) => {
  const sheets = useSheets();
  const initialIngredient = data.ingredient;
  const initialSelected = initialIngredient?.selectedProduct ?? null;

  const [phase, setPhase] = useState<IngredientEditorPhase>(initialSelected ? 'ingredient' : 'search');
  const [query, setQuery] = useState(initialIngredient?.name ?? '');
  const [selectedProduct, setSelectedProduct] = useState<SelectedProduct | null>(initialSelected);

  const productForm = useAppForm({
    defaultValues:
      initialIngredient?.selectedProduct.type === 'draft'
        ? productFormFromDraft(initialIngredient.selectedProduct.product)
        : emptyProductForm,
    validators: {
      onSubmit: productDraftSchema,
    },
    onSubmit: ({ value }) => {
      const selected: SelectedProduct = { type: 'draft', product: productDraftFromForm(value) };
      setSelectedProduct(selected);
      setIngredientFormValues(ingredientFromProduct(selected, ingredientForm.state.values));
      setPhase('ingredient');
    },
  });

  const ingredientForm = useAppForm({
    defaultValues: initialSelected ? ingredientFromProduct(initialSelected, initialIngredient) : emptyIngredientForm(),
    validators: {
      onSubmit: ingredientSchema,
    },
    onSubmit: ({ value }) => {
      if (!selectedProduct) return;
      const displayName = value.name_override?.trim() || selectedProduct.product.name;
      if (!displayName.trim()) return;

      sheets.dismiss(sheetId, {
        ...value,
        selectedProduct,
        name: displayName,
        aisle: selectedProduct.product.aisle,
        unit: value.unit,
      });
      Keyboard.dismiss();
    },
  });

  const setProductFormValues = (form: ProductDraftForm) => {
    productForm.setFieldValue('name', form.name);
    productForm.setFieldValue('aisle', form.aisle);
    productForm.setFieldValue('pack_count', form.pack_count);
    productForm.setFieldValue('mode', form.mode);
    productForm.setFieldValue('quantity', form.quantity);
    productForm.setFieldValue('unit', form.unit);
    productForm.setFieldValue('reminder_frequency_value', form.reminder_frequency_value);
    productForm.setFieldValue('reminder_frequency_unit', form.reminder_frequency_unit);
  };

  const setIngredientFormValues = (ingredient: IngredientDetailsFormData) => {
    ingredientForm.setFieldValue('id', ingredient.id);
    ingredientForm.setFieldValue('name', ingredient.name);
    ingredientForm.setFieldValue('name_override', ingredient.name_override);
    ingredientForm.setFieldValue('quantity', ingredient.quantity);
    ingredientForm.setFieldValue('unit', ingredient.unit);
    ingredientForm.setFieldValue('aisle', ingredient.aisle);
  };

  const selectExistingProduct = (product: ProductDTO) => {
    const selected: SelectedProduct = { type: 'existing', product };
    setSelectedProduct(selected);
    setIngredientFormValues(ingredientFromProduct(selected, ingredientForm.state.values));
    setPhase('ingredient');
    Keyboard.dismiss();
  };

  const startDraftProduct = (form: ProductDraftForm) => {
    setProductFormValues(form);
    setPhase('product');
    Keyboard.dismiss();
  };

  const selectProductChoice = (choice: ProductChoice) => {
    if (choice.kind === 'product') {
      selectExistingProduct(choice.product);
    } else if (choice.kind === 'suggestion') {
      startDraftProduct(productFormFromSuggestion(choice.suggestion));
    } else {
      startDraftProduct(productFormFromQuery(choice.name));
    }
  };

  const back = () => {
    if (phase === 'search') return;
    setPhase('search');
  };

  const editDraftProduct = () => {
    if (selectedProduct?.type !== 'draft') return;
    setProductFormValues(productFormFromDraft(selectedProduct.product));
    setPhase('product');
  };

  const clearProduct = () => setPhase('search');

  const selectProductUnit = async () => {
    Keyboard.dismiss();
    const unit = await sheets.present('select-unit-sheet', {
      data: {
        unit: productForm.state.values.unit,
      },
    });
    if (unit != null && unit !== 'count') productForm.setFieldValue('unit', unit);
  };

  const selectIngredientUnit = async () => {
    Keyboard.dismiss();
    const unit = await sheets.present('select-unit-sheet', {
      data: {
        unit: ingredientForm.state.values.unit,
      },
    });
    if (unit != null) ingredientForm.setFieldValue('unit', unit);
  };

  const selectAisle = async () => {
    Keyboard.dismiss();
    const aisle = await sheets.present('select-category-sheet');
    if (aisle != null) productForm.setFieldValue('aisle', aisle);
  };

  const submitProduct = () => productForm.handleSubmit();
  const saveIngredient = () => ingredientForm.handleSubmit();

  const action =
    phase === 'product'
      ? { text: 'Next', onPress: submitProduct }
      : phase === 'ingredient'
        ? { text: 'Save ingredient', onPress: saveIngredient }
        : null;

  const title = phase === 'product' ? 'Item Details' : initialIngredient ? 'Edit Ingredient' : 'Add Ingredient';

  return {
    action,
    back,
    canGoBack: phase !== 'search',
    clearProduct,
    editDraftProduct,
    ingredientForm,
    phase,
    productForm,
    query,
    selectAisle,
    selectIngredientUnit,
    selectProductChoice,
    selectProductUnit,
    selectedProduct,
    setQuery,
    title,
  };
};

export type IngredientEditor = ReturnType<typeof useIngredientEditor>;
