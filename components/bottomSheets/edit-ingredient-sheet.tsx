import { BaseSheet, sheetFooter } from '@/components/bottomSheets/base-sheet';
import { Button } from '@/components/button';
import { IngredientDetailsStep } from '@/components/bottomSheets/editIngredient/ingredient-details-step';
import { IngredientProductSearchStep } from '@/components/bottomSheets/editIngredient/ingredient-product-search-step';
import { IngredientSheetHeader } from '@/components/bottomSheets/editIngredient/ingredient-sheet-header';
import { ProductDraftStep } from '@/components/bottomSheets/editIngredient/product-draft-step';
import { useIngredientEditor } from '@/components/bottomSheets/editIngredient/use-ingredient-editor';
import { SheetProps } from '@/lib/sheet-context';
import { ArrowRight } from 'lucide-react-native';
import { View } from 'react-native';

export const EditIngredientSheet = (props: SheetProps<'edit-ingredient-sheet'>) => {
  const editor = useIngredientEditor({ sheetId: props.sheetId, data: props.data });

  return (
    <BaseSheet
      id={props.sheetId}
      footer={
        editor.action
          ? sheetFooter.buttonRow(
              <Button
                text={editor.action.text}
                variant="primary"
                rightIcon={{ Icon: ArrowRight }}
                onPress={editor.action.onPress}
                isLoading={editor.action.isLoading}
              />
            )
          : undefined
      }
    >
      <IngredientSheetHeader canGoBack={editor.canGoBack} onBack={editor.back} title={editor.title} />

      {editor.phase === 'search' && (
        <IngredientProductSearchStep
          query={editor.query}
          onQueryChange={editor.setQuery}
          onSelect={editor.selectProductChoice}
        />
      )}

      {editor.phase === 'product' && (
        <ProductDraftStep
          form={editor.productForm}
          onSelectAisle={editor.selectAisle}
          onSelectUnit={editor.selectProductUnit}
        />
      )}

      {editor.phase === 'ingredient' && editor.selectedProduct && (
        <>
          <IngredientDetailsStep
            form={editor.ingredientForm}
            selectedProduct={editor.selectedProduct}
            onClearProduct={editor.clearProduct}
            onEditDraftProduct={editor.editDraftProduct}
            onEditExistingProduct={editor.editExistingProduct}
            onSelectUnit={editor.selectIngredientUnit}
            conversionValues={editor.conversionValues}
            conversionError={editor.conversionError}
            onConversionChange={editor.setConversionValue}
          />
          <View style={{ height: 72 }} />
        </>
      )}
    </BaseSheet>
  );
};
