import { BaseSheet, SHEET_FOOTER_HEIGHT } from '@/components/bottomSheets/base-sheet';
import { Button } from '@/components/button';
import { IngredientDetailsStep } from '@/components/bottomSheets/editIngredient/ingredient-details-step';
import { IngredientSheetHeader } from '@/components/bottomSheets/editIngredient/ingredient-sheet-header';
import { ProductDraftStep } from '@/components/bottomSheets/editIngredient/product-draft-step';
import { useIngredientEditor } from '@/components/bottomSheets/editIngredient/use-ingredient-editor';
import { ProductSearchStep } from '@/components/product-search-step';
import { SheetProps } from '@/lib/sheet-context';
import { ArrowRight } from 'lucide-react-native';
import { View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const EditIngredientSheet = (props: SheetProps<'edit-ingredient-sheet'>) => {
  const insets = useSafeAreaInsets();
  const { step, header, action, feedback } = useIngredientEditor({ sheetId: props.sheetId, data: props.data });
  const footerHeight = SHEET_FOOTER_HEIGHT + insets.bottom;

  return (
    <BaseSheet id={props.sheetId}
      sizing={step.phase === 'search' ? { type: 'auto' } : { type: 'scrollable', detents: step.phase === 'product' ? [1] : [0.6, 1] }}
      footer={action ? <Button text={action.text} variant="primary" rightIcon={{ Icon: ArrowRight }}
        onPress={action.onPress} isLoading={action.isLoading} /> : undefined}>
      {step.phase === 'search' ? (
        <>
          <IngredientSheetHeader {...header} />
          <ProductSearchStep {...step} context="recipe" placeholder="Search shopping items..." autoFocus listStyle={{ maxHeight: 240 }} />
        </>
      ) : (
        <KeyboardAwareScrollView ref={feedback.scrollRef} showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" bottomOffset={footerHeight}
          contentContainerStyle={{ paddingBottom: footerHeight + 24 }}>
          <View ref={feedback.contentRef}>
            <IngredientSheetHeader {...header} />
            {step.phase === 'product' ? (
              <ProductDraftStep {...step} nameInputRef={feedback.inputRef('name')}
                registerControl={(field, node) => feedback.controlRef(field)(node)} />
            ) : (
              <IngredientDetailsStep {...step} displayNameInputRef={feedback.inputRef('name_override')}
                quantityInputRef={feedback.inputRef('quantity')} unitControlRef={feedback.controlRef('unit')} conversionInputRef={feedback.inputRef('conversion')} />
            )}
          </View>
        </KeyboardAwareScrollView>
      )}
    </BaseSheet>
  );
};
