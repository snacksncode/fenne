import { useEditProduct } from '@/api/products';
import { ProductDTO } from '@/api/types';
import { useStore } from '@tanstack/react-form';
import { useFormFeedback } from '@/components/form/use-form-feedback';
import { useAppForm } from '@/components/form/app-form';
import { ProductChoice } from '@/components/product-search-step';
import {
  convertPackSizeInputs,
  productConversionRequirement,
  withProductConversion,
} from '@/lib/product-conversions';
import { SheetProps, useSheets } from '@/lib/sheet-context';
import { parseLocaleFloat } from '@/lib/quantity';
import { Keyboard } from 'react-native';
import { useState } from 'react';
import { Unit } from '@/lib/quantity';
import {
  emptyIngredientForm,
  emptyProductForm,
  IngredientDetailsFormData,
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

const productFieldOrder: (keyof ProductDraftForm)[] = [
  'name',
  'aisle',
  'unit',
  'pack_sizes',
  'reminder_frequency_value',
  'reminder_frequency_unit',
];

const ingredientFieldOrder: (keyof IngredientDetailsFormData)[] = ['name_override', 'quantity', 'unit'];

export const useIngredientEditor = ({
  sheetId,
  data,
}: UseIngredientEditorParams) => {
  const sheets = useSheets();
  const editProduct = useEditProduct();
  const initialIngredient = data.ingredient;
  const initialSelected = initialIngredient?.selectedProduct ?? null;
  const [initialIngredientValues] = useState(() =>
    initialSelected ? ingredientFromProduct(initialSelected, initialIngredient) : emptyIngredientForm()
  );

  const [step, setStep] = useState<{ phase: 'search' } | { phase: 'product'; preserveIngredient?: boolean } | { phase: 'ingredient'; selectedProduct: SelectedProduct }>(
    initialSelected ? { phase: 'ingredient', selectedProduct: initialSelected } : { phase: 'search' }
  );
  const { phase } = step;
  const selectedProduct = step.phase === 'ingredient' ? step.selectedProduct : null;
  const feedback = useFormFeedback<keyof ProductDraftForm | keyof IngredientDetailsFormData | 'conversion'>(
    phase === 'product' ? productFieldOrder : [...ingredientFieldOrder, 'conversion']
  );
  const [query, setQuery] = useState(initialIngredient?.name ?? '');
  const [conversionValues, setConversionValues] = useState<Partial<Record<Unit, string>>>({});
  const [conversionError, setConversionError] = useState<string | null>(null);

  const resolveIngredientProduct = async (ingredient: IngredientDetailsFormData) => {
    if (!selectedProduct) return null;

    const requirement = productConversionRequirement(selectedProduct.product, ingredient.unit);
    if (!requirement) return selectedProduct;

    const conversion = parseLocaleFloat(conversionValues[requirement.ingredientUnit] ?? '');
    if (!Number.isFinite(conversion) || conversion <= 0) {
      setConversionError('Enter a conversion greater than 0');
      feedback.focus('conversion');
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
      setStep({ phase: 'ingredient', selectedProduct: resolved });
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
    onSubmitInvalid: ({ formApi }) => feedback.focusInvalid(formApi),
    onSubmit: ({ value }) => {
      const selected: SelectedProduct = { type: 'draft', product: productDraftFromForm(value) };
      ingredientForm.reset(
        ingredientFromProduct(selected, initialIngredient || (step.phase === 'product' && step.preserveIngredient) ? ingredientForm.state.values : undefined),
        { keepDefaultValues: true }
      );
      setStep({ phase: 'ingredient', selectedProduct: selected });
    },
  });

  const ingredientForm = useAppForm({
    defaultValues: initialIngredientValues,
    validators: {
      onSubmit: ingredientSchema,
    },
    onSubmitInvalid: ({ formApi }) => feedback.focusInvalid(formApi),
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

  const selectExistingProduct = (product: ProductDTO) => {
    const selected: SelectedProduct = { type: 'existing', product };
    setConversionValues({});
    setConversionError(null);
    ingredientForm.reset(
      ingredientFromProduct(selected, initialIngredient ? ingredientForm.state.values : undefined),
      { keepDefaultValues: true }
    );
    setStep({ phase: 'ingredient', selectedProduct: selected });
    Keyboard.dismiss();
  };

  const startDraftProduct = (form: ProductDraftForm) => {
    productForm.reset(form, { keepDefaultValues: true });
    setConversionValues({});
    setConversionError(null);
    setStep({ phase: 'product' });
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
    setStep({ phase: 'search' });
  };

  const editDraftProduct = () => {
    if (selectedProduct?.type !== 'draft') return;
    productForm.reset(productFormFromDraft(selectedProduct.product), { keepDefaultValues: true });
    setStep({ phase: 'product', preserveIngredient: true });
  };

  const editExistingProduct = async () => {
    if (selectedProduct?.type !== 'existing') return;
    Keyboard.dismiss();

    const updatedProduct = await sheets.present('product-edit-sheet', {
      data: { product: selectedProduct.product },
    });

    if (updatedProduct == null) return;

    const selected: SelectedProduct = { type: 'existing', product: updatedProduct };
    setConversionError(null);
    ingredientForm.reset(ingredientFromProduct(selected, ingredientForm.state.values), { keepDefaultValues: true });
    setStep({ phase: 'ingredient', selectedProduct: selected });
  };

  const selectProductUnit = async () => {
    Keyboard.dismiss();
    const unit = await sheets.present('select-unit-sheet', {
      data: {
        unit: productForm.state.values.unit,
      },
    });
    if (unit != null) {
      productForm.setFieldValue('pack_sizes', convertPackSizeInputs(productForm.state.values.pack_sizes, productForm.state.values.unit, unit));
      productForm.setFieldValue('unit', unit);
    }
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

  const saving = useStore(ingredientForm.store, (state) => state.isSubmitting);
  const ingredientUnit = useStore(ingredientForm.store, (state) => state.values.unit);

  const action =
    phase === 'product'
      ? { text: 'Next', onPress: submitProduct }
      : phase === 'ingredient'
        ? {
            text:
              selectedProduct &&
              productConversionRequirement(selectedProduct.product, ingredientUnit)
                ? 'Save conversion & ingredient'
                : 'Save ingredient',
            onPress: saveIngredient,
            isLoading: saving,
          }
        : null;

  const title =
    phase === 'product' ? 'Shopping item details' : initialIngredient ? 'Edit ingredient' : 'Add ingredient';

  const activeStep = step.phase === 'ingredient' ? {
    phase: 'ingredient' as const,
    form: ingredientForm,
    selectedProduct: step.selectedProduct,
    onClearProduct: back,
    onEditProduct: step.selectedProduct.type === 'draft' ? editDraftProduct : editExistingProduct,
    onSelectUnit: selectIngredientUnit,
    conversionValues,
    conversionError,
    onConversionChange: setConversionValue,
  } : step.phase === 'product' ? {
    phase: 'product' as const,
    form: productForm,
    onSelectAisle: selectAisle,
    onSelectUnit: selectProductUnit,
  } : {
    phase: 'search' as const,
    query,
    onQueryChange: setQuery,
    onSelect: selectProductChoice,
  };

  return {
    action,
    header: { title, canGoBack: phase !== 'search', onBack: back },
    step: activeStep,
    feedback,
  };
};

export type IngredientEditor = ReturnType<typeof useIngredientEditor>;
