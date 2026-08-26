import { useEditProduct } from '@/api/products';
import { ProductDTO } from '@/api/types';
import { useAppForm } from '@/components/form/app-form';
import { ProductChoice } from '@/components/product-search-step';
import {
  productConversionRequirement,
  withProductConversion,
} from '@/lib/product-conversions';
import { SheetProps, useSheets } from '@/lib/sheet-context';
import { parseLocaleFloat } from '@/utils';
import { Keyboard } from 'react-native';
import { useState } from 'react';
import { Unit } from '@/components/bottomSheets/select-unit-sheet';
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
  const editProduct = useEditProduct();
  const initialIngredient = data.ingredient;
  const initialSelected = initialIngredient?.selectedProduct ?? null;

  const [phase, setPhase] = useState<IngredientEditorPhase>(initialSelected ? 'ingredient' : 'search');
  const [query, setQuery] = useState(initialIngredient?.name ?? '');
  const [selectedProduct, setSelectedProduct] = useState<SelectedProduct | null>(initialSelected);
  const [conversionValues, setConversionValues] = useState<Partial<Record<Unit, string>>>({});
  const [conversionError, setConversionError] = useState<string | null>(null);

  const resolveIngredientProduct = async (ingredient: IngredientDetailsFormData) => {
    if (!selectedProduct) return null;

    const requirement = productConversionRequirement(selectedProduct.product, ingredient.unit);
    if (!requirement) return selectedProduct;

    const conversion = parseLocaleFloat(conversionValues[requirement.ingredientUnit] ?? '');
    if (!Number.isFinite(conversion) || conversion <= 0) {
      setConversionError('Enter a conversion greater than 0');
      return null;
    }

    try {
      const product =
        selectedProduct.type === 'existing'
          ? await editProduct.mutateAsync({
              id: selectedProduct.product.id,
              conversions: { [requirement.ingredientUnit]: conversion },
            })
          : withProductConversion(selectedProduct.product, requirement.ingredientUnit, conversion);
      const resolved: SelectedProduct = { type: selectedProduct.type, product } as SelectedProduct;
      setSelectedProduct(resolved);
      setConversionError(null);
      return resolved;
    } catch {
      setConversionError('Could not save this conversion');
      return null;
    }
  };

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
      setIngredientFormValues(
        ingredientFromProduct(selected, initialIngredient ? ingredientForm.state.values : undefined)
      );
      setPhase('ingredient');
    },
  });

  const ingredientForm = useAppForm({
    defaultValues: initialSelected ? ingredientFromProduct(initialSelected, initialIngredient) : emptyIngredientForm(),
    validators: {
      onSubmit: ingredientSchema,
    },
    onSubmit: async ({ value }) => {
      const resolvedProduct = await resolveIngredientProduct(value);
      if (!resolvedProduct) return;

      const displayName = value.name_override?.trim() || resolvedProduct.product.name;
      if (!displayName.trim()) return;

      sheets.dismiss(sheetId, {
        ...value,
        selectedProduct: resolvedProduct,
        name: displayName,
        aisle: resolvedProduct.product.aisle,
        unit: value.unit,
      });
      Keyboard.dismiss();
    },
  });

  const setProductFormValues = (form: ProductDraftForm) => {
    productForm.setFieldValue('name', form.name);
    productForm.setFieldValue('aisle', form.aisle);
    productForm.setFieldValue('mode', form.mode);
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
    setConversionValues({});
    setConversionError(null);
    setIngredientFormValues(
      ingredientFromProduct(selected, initialIngredient ? ingredientForm.state.values : undefined)
    );
    setPhase('ingredient');
    Keyboard.dismiss();
  };

  const startDraftProduct = (form: ProductDraftForm) => {
    setProductFormValues(form);
    setConversionValues({});
    setConversionError(null);
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

  const editExistingProduct = async () => {
    if (selectedProduct?.type !== 'existing') return;
    Keyboard.dismiss();

    const updatedProduct = await sheets.present('product-edit-sheet', {
      data: { product: selectedProduct.product },
    });

    if (updatedProduct == null) return;

    const selected: SelectedProduct = { type: 'existing', product: updatedProduct };
    setSelectedProduct(selected);
    setConversionError(null);
    setIngredientFormValues(ingredientFromProduct(selected, ingredientForm.state.values));
  };

  const clearProduct = () => setPhase('search');

  const selectProductUnit = async () => {
    Keyboard.dismiss();
    const unit = await sheets.present('select-unit-sheet', {
      data: {
        unit: productForm.state.values.unit,
      },
    });
    if (unit != null) productForm.setFieldValue('unit', unit);
  };

  const selectIngredientUnit = async () => {
    Keyboard.dismiss();
    const unit = await sheets.present('select-unit-sheet', {
      data: {
        unit: ingredientForm.state.values.unit,
      },
    });
    if (unit != null) {
      ingredientForm.setFieldValue('unit', unit);
      setConversionValues((current) => ({ ...current, [unit]: current[unit] ?? '' }));
      setConversionError(null);
    }
  };

  const setConversionValue = (unit: Unit, value: string) => {
    setConversionValues((current) => ({ ...current, [unit]: value }));
    setConversionError(null);
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
        ? {
            text:
              selectedProduct &&
              productConversionRequirement(selectedProduct.product, ingredientForm.state.values.unit)
                ? 'Save conversion & ingredient'
                : 'Save ingredient',
            onPress: saveIngredient,
            isLoading: editProduct.isPending,
          }
        : null;

  const title =
    phase === 'product' ? 'Shopping item details' : initialIngredient ? 'Edit ingredient' : 'Add ingredient';

  return {
    action,
    back,
    canGoBack: phase !== 'search',
    clearProduct,
    conversionError,
    conversionValues,
    editDraftProduct,
    editExistingProduct,
    ingredientForm,
    phase,
    productForm,
    query,
    selectAisle,
    selectIngredientUnit,
    selectProductChoice,
    selectProductUnit,
    selectedProduct,
    setConversionValue,
    setQuery,
    title,
  };
};

export type IngredientEditor = ReturnType<typeof useIngredientEditor>;
