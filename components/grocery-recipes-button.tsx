import { PressableWithHaptics } from '@/components/pressable-with-feedback';
import { colors } from '@/constants/colors';
import { useSheets } from '@/lib/sheet-context';
import { CircleHelp } from 'lucide-react-native';

export const GroceryRecipesButton = (data: {
  name: string;
  recipes: { id: string; name: string }[];
  reason?: string;
}) => {
  const sheets = useSheets();
  return (
    <PressableWithHaptics
      accessibilityRole="button"
      accessibilityLabel={`Why is ${data.name} on the list?`}
      hitSlop={6}
      onPress={() => sheets.present('grocery-recipes-sheet', { data })}
      style={{ alignItems: 'center', justifyContent: 'center', width: 32, height: 32,
        backgroundColor: colors.cream[50], borderColor: colors.border.muted, borderRadius: 16, borderWidth: 1 }}
    >
      <CircleHelp size={20} strokeWidth={2.25} color={colors.brown[700]} />
    </PressableWithHaptics>
  );
};
