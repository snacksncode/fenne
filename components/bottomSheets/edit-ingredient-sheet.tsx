import { BaseSheet, sheetFooter, SHEET_FOOTER_HEIGHT } from '@/components/bottomSheets/base-sheet';
import { Button } from '@/components/button';
import { IngredientDetailsStep } from '@/components/bottomSheets/editIngredient/ingredient-details-step';
import { IngredientProductSearchStep } from '@/components/bottomSheets/editIngredient/ingredient-product-search-step';
import { IngredientSheetHeader } from '@/components/bottomSheets/editIngredient/ingredient-sheet-header';
import { ProductDraftStep } from '@/components/bottomSheets/editIngredient/product-draft-step';
import { useIngredientEditor } from '@/components/bottomSheets/editIngredient/use-ingredient-editor';
import { IngredientDetailsFormData, ProductDraftForm } from '@/components/bottomSheets/editIngredient/ingredient-editor-model';
import { TextInputRef } from '@/components/input';
import { ShoppingItemBehaviorField } from '@/components/shopping-item-behavior-fields';
import { SheetProps } from '@/lib/sheet-context';
import { ArrowRight } from 'lucide-react-native';
import { useRef } from 'react';
import { AccessibilityInfo, findNodeHandle, View } from 'react-native';
import { KeyboardAwareScrollView, KeyboardAwareScrollViewRef } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const EditIngredientSheet = (props: SheetProps<'edit-ingredient-sheet'>) => {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<KeyboardAwareScrollViewRef>(null);
  const contentRef = useRef<View>(null);
  const productNameRef = useRef<TextInputRef>(null);
  const displayNameRef = useRef<TextInputRef>(null);
  const quantityRef = useRef<TextInputRef>(null);
  const conversionInputRef = useRef<TextInputRef>(null);
  const controlRefs = useRef<Partial<Record<ShoppingItemBehaviorField, View | null>>>({});

  const focusInput = (input: TextInputRef | null) => {
    if (!input) return;
    requestAnimationFrame(() => {
      input.focus();
      requestAnimationFrame(() => scrollRef.current?.assureFocusedInputVisible());
    });
  };

  const focusControl = (field: ShoppingItemBehaviorField) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const node = controlRefs.current[field];
        const content = contentRef.current;
        if (node && content) {
          node.measureLayout(content, (_x, y) => {
            scrollRef.current?.scrollTo({ y: Math.max(0, y - 16), animated: true });
          });
        }
        const handle = node ? findNodeHandle(node) : null;
        if (handle) AccessibilityInfo.setAccessibilityFocus(handle);
      });
    });
  };

  const editor = useIngredientEditor({
    sheetId: props.sheetId,
    data: props.data,
    onProductInvalid: (field: keyof ProductDraftForm) => {
      if (field === 'name') focusInput(productNameRef.current);
      else if (field !== 'mode') focusControl(field);
    },
    onIngredientInvalid: (field: keyof IngredientDetailsFormData) => {
      if (field === 'name_override') focusInput(displayNameRef.current);
      else if (field === 'quantity') focusInput(quantityRef.current);
      else scrollRef.current?.scrollToEnd({ animated: true });
    },
    onConversionInvalid: () => focusInput(conversionInputRef.current),
  });

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
        <KeyboardAwareScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          bottomOffset={SHEET_FOOTER_HEIGHT + insets.bottom}
          contentContainerStyle={{ paddingBottom: SHEET_FOOTER_HEIGHT + insets.bottom + 24 }}
        >
          <View ref={contentRef}>
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
              displayNameInputRef={displayNameRef}
              quantityInputRef={quantityRef}
              conversionInputRef={conversionInputRef}
            />
          </View>
        </KeyboardAwareScrollView>
      )}

      {editor.phase === 'product' && (
        <KeyboardAwareScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          bottomOffset={SHEET_FOOTER_HEIGHT + insets.bottom}
          contentContainerStyle={{ paddingBottom: SHEET_FOOTER_HEIGHT + insets.bottom + 24 }}
        >
          <View ref={contentRef}>
            <IngredientSheetHeader canGoBack={editor.canGoBack} onBack={editor.back} title={editor.title} />
            <ProductDraftStep
              form={editor.productForm}
              onSelectAisle={editor.selectAisle}
              onSelectUnit={editor.selectProductUnit}
              nameInputRef={productNameRef}
              registerControl={(field, node) => {
                controlRefs.current[field] = node;
              }}
            />
          </View>
        </KeyboardAwareScrollView>
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
