import { BaseSheet, sheetFooter } from '@/components/bottomSheets/base-sheet';
import { Button } from '@/components/button';
import { IngredientDetailsStep } from '@/components/bottomSheets/editIngredient/ingredient-details-step';
import { IngredientProductSearchStep } from '@/components/bottomSheets/editIngredient/ingredient-product-search-step';
import { IngredientSheetHeader } from '@/components/bottomSheets/editIngredient/ingredient-sheet-header';
import { ProductDraftStep } from '@/components/bottomSheets/editIngredient/product-draft-step';
import { useIngredientEditor } from '@/components/bottomSheets/editIngredient/use-ingredient-editor';
import { SheetProps } from '@/lib/sheet-context';
import { ArrowRight } from 'lucide-react-native';
import { ScrollView } from 'react-native';

export const EditIngredientSheet = (props: SheetProps<'edit-ingredient-sheet'>) => {
  const editor = useIngredientEditor({ sheetId: props.sheetId, data: props.data });

  return (
    <BaseSheet
      id={props.sheetId}
      sizing={
        editor.phase === 'search'
          ? { type: 'auto' }
          : editor.phase === 'product'
            ? { type: 'scrollable', detents: [1] }
            : { type: 'scrollable', detents: [0.6, 1] }
      }
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
      {editor.phase === 'ingredient' && editor.selectedProduct && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          contentContainerStyle={{ paddingBottom: 72 }}
        >
          <IngredientSheetHeader canGoBack={editor.canGoBack} onBack={editor.back} title={editor.title} />
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
        </ScrollView>
      )}

      {editor.phase === 'product' && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          contentContainerStyle={{ paddingBottom: 72 }}
        >
          <IngredientSheetHeader canGoBack={editor.canGoBack} onBack={editor.back} title={editor.title} />
          <ProductDraftStep
            form={editor.productForm}
            onSelectAisle={editor.selectAisle}
            onSelectUnit={editor.selectProductUnit}
          />
        </ScrollView>
      )}

      {editor.phase === 'search' && (
        <>
          <IngredientSheetHeader canGoBack={editor.canGoBack} onBack={editor.back} title={editor.title} />
          <IngredientProductSearchStep
            query={editor.query}
            onQueryChange={editor.setQuery}
            onSelect={editor.selectProductChoice}
          />
        </>
      )}
    </BaseSheet>
  );
};
