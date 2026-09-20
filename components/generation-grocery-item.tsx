import { MealType, ProductDTO, PurchaseSuggestionDTO } from '@/api/types';
import { Checkbox, useCheckbox } from '@/components/checkbox';
import { Button } from '@/components/button';
import { GroceryQuantity, formatGroceryQuantity } from '@/components/grocery-quantity';
import { PurchaseAmountEditor } from '@/components/purchase-amount-editor';
import { RecipeMealIcon } from '@/components/recipe-meal-icon';
import { PurchaseCalculations } from '@/components/purchase-calculations';
import { PressableWithHaptics } from '@/components/pressable-with-feedback';
import { Typography } from '@/components/Typography';
import { colors } from '@/constants/colors';
import { useSheets } from '@/lib/sheet-context';
import { ChevronDown, Pencil } from 'lucide-react-native';
import { useState } from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';
import Animated, { Easing, LinearTransition, ReduceMotion, useAnimatedStyle, useDerivedValue, useReducedMotion, withTiming } from 'react-native-reanimated';

const EXPAND_ANIMATION = { duration: 220, easing: Easing.inOut(Easing.cubic) };
export const GROCERY_LAYOUT_TRANSITION = LinearTransition.duration(220)
  .easing(Easing.inOut(Easing.cubic)).reduceMotion(ReduceMotion.System);

export const GenerationGroceryItem = ({ product, purchase, quantity, overridden, onChange, onEditingChange,
  checked, checkboxLabel, onToggle, recipes, reason }: {
  product: Pick<ProductDTO, 'id' | 'name' | 'unit' | 'pack_sizes'>;
  purchase?: PurchaseSuggestionDTO | null;
  quantity: number;
  overridden?: boolean;
  onChange: (quantity: number | null) => Promise<unknown> | void;
  onEditingChange: (editing: boolean) => void;
  checked: boolean; checkboxLabel: string; onToggle: () => void;
  recipes: { id: string; name: string; meal_type?: MealType }[]; reason?: string;
}) => {
  const { progress } = useCheckbox(checked);
  const sheets = useSheets();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [detailsHeight, setDetailsHeight] = useState(0);
  const isOpen = expanded || editing;
  const reduceMotion = useReducedMotion();
  const openness = useDerivedValue(() => reduceMotion ? Number(isOpen)
    : withTiming(Number(isOpen), EXPAND_ANIMATION));
  const detailsOpacity = useAnimatedStyle(() => ({ opacity: openness.get() }));
  const arrowStyle = useAnimatedStyle(() => ({ transform: [{ translateY: 2 }, { rotate: `${openness.get() * 180}deg` }] }));
  const finishEditing = () => { setEditing(false); onEditingChange(false); Keyboard.dismiss(); };
  const openAmounts = async () => {
    if (!purchase) { setEditing(true); onEditingChange(true); return; }
    onEditingChange(true);
    try {
      const result = await sheets.present('generation-amounts-sheet', { data: { product, purchase, quantity, overridden } });
      if (result) await onChange(result.quantity);
    } finally {
      onEditingChange(false);
    }
  };
  const packText = !overridden && quantity === purchase?.suggested_quantity
    ? purchase?.packs.map((pack) => `${pack.count} × ${formatGroceryQuantity(pack.size, product.unit)}`).join(' + ') : '';
  const coveredByPantry = quantity === 0 && !!purchase && purchase.pantry > 0 && purchase.shortage === 0;
  const toggleExpanded = () => { setExpanded((value) => !value); };
  return <PressableWithHaptics accessible={false} scaleTo={1}
    onPress={editing ? undefined : purchase ? toggleExpanded : onToggle}>
    <View style={styles.row}>
      <PressableWithHaptics accessibilityRole="checkbox" accessibilityLabel={checkboxLabel}
        accessibilityState={{ checked }} disabled={editing} onPress={onToggle} hitSlop={{ top: 10, bottom: 10, left: 10, right: 8 }}>
        <Checkbox progress={progress} />
      </PressableWithHaptics>
      <View style={styles.name} accessible={!!purchase} accessibilityRole={purchase ? 'button' : undefined}
        accessibilityLabel={`${expanded || editing ? 'Hide' : 'Show'} amount details for ${product.name}`}
        accessibilityState={{ expanded: expanded || editing, disabled: editing }}
        onAccessibilityTap={purchase && !editing ? toggleExpanded : undefined}>
        <Typography variant="body-base" weight="bold" style={{ flexShrink: 1 }}>{product.name}</Typography>
        {purchase && <Animated.View style={arrowStyle}>
          <ChevronDown size={18} strokeWidth={2.5} color={colors.brown[900]} />
        </Animated.View>}
      </View>
      <PressableWithHaptics accessibilityRole="button" accessibilityLabel={`Edit amount for ${product.name}, ${coveredByPantry ? 'in pantry' : formatGroceryQuantity(quantity, product.unit)}`}
        disabled={editing} onPress={openAmounts} hitSlop={5}>
        <GroceryQuantity quantity={quantity} unit={product.unit} coveredByPantry={coveredByPantry} />
      </PressableWithHaptics>

    </View>
    {(recipes.length > 0 || reason) && <View style={styles.recipes}>
      {recipes.map((recipe) => <View key={recipe.id} style={styles.recipeRow}>
        <RecipeMealIcon mealType={recipe.meal_type} compact />
        <Typography variant="body-sm" weight="medium" color={colors.brown[700]} style={{ flex: 1 }}>
          {recipe.name}
        </Typography>
      </View>)}
      {recipes.length === 0 && reason && <Typography variant="body-xs" weight="medium" color={colors.brown[700]}>
        {reason}
      </Typography>}
    </View>}
    <Animated.View layout={GROCERY_LAYOUT_TRANSITION} collapsable={false} style={[styles.disclosure, { height: isOpen ? detailsHeight : 0 }]}
      pointerEvents={isOpen ? 'auto' : 'none'} accessibilityElementsHidden={!isOpen}
      importantForAccessibility={isOpen ? 'auto' : 'no-hide-descendants'}>
      <Animated.View style={[styles.details, detailsOpacity]} onLayout={(event) => {
        const height = event.nativeEvent.layout.height;
        setDetailsHeight((current) => current === height ? current : height);
      }}>
      {purchase && <PurchaseCalculations purchase={purchase} unit={product.unit} />}
      {!!packText && <Typography variant="body-xs" weight="medium" color={colors.brown[700]}>Packs: {packText}</Typography>}
      {purchase && <Button text="Edit amounts" size="small" variant="outlined" leftIcon={{ Icon: Pencil }} onPress={openAmounts} />}
      {editing && <PurchaseAmountEditor name={product.name} unit={product.unit} quantity={quantity}
        packSizes={product.pack_sizes} purchase={purchase} overridden={overridden} onCancel={finishEditing}
        onSave={async (amount) => { await onChange(amount); finishEditing(); }} />}
      </Animated.View>
    </Animated.View>
  </PressableWithHaptics>;
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 12, minHeight: 56 },
  name: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2 },
  recipes: { gap: 4, paddingLeft: 44, paddingRight: 12, paddingBottom: 12, marginTop: -4 },
  recipeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  disclosure: { overflow: 'hidden' },
  // Keep content at its natural size while its parent animates the clipping height.
  details: { position: 'absolute', top: 0, width: '100%', gap: 12, paddingHorizontal: 12, paddingBottom: 12 },
});
