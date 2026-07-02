import { BaseSheet } from '@/components/bottomSheets/base-sheet';
import { PressableWithHaptics } from '@/components/pressable-with-feedback';
import { Typography } from '@/components/Typography';
import { colors } from '@/constants/colors';
import { SheetProps, useSheets } from '@/lib/sheet-context';
import { Archive, Bell, Check, PackageCheck } from 'lucide-react-native';
import { FunctionComponent } from 'react';
import { View } from 'react-native';

export type PantryFilter = 'all' | 'tracked' | 'reminders';

const options: { value: PantryFilter; label: string; icon: FunctionComponent<{ size: number; color: string }> }[] = [
  { value: 'all', label: 'All pantry', icon: Archive },
  { value: 'tracked', label: 'Tracked stock', icon: PackageCheck },
  { value: 'reminders', label: 'Reminders', icon: Bell },
];

export const PantryFilterSheet = (props: SheetProps<'pantry-filter-sheet'>) => {
  const sheets = useSheets();
  const current = props.data?.current ?? 'all';

  const handleSelect = (value: PantryFilter) => {
    sheets.dismiss(props.sheetId, value);
  };

  return (
    <BaseSheet id={props.sheetId}>
      <Typography variant="heading-sm" weight="bold" style={{ marginBottom: 12 }}>
        Filter pantry
      </Typography>
      <View style={{ gap: 4, paddingBottom: 8 }}>
        {options.map((option) => {
          const isSelected = current === option.value;

          return (
            <PressableWithHaptics
              key={option.value}
              scaleTo={0.97}
              onPress={() => handleSelect(option.value)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 14,
                paddingHorizontal: 16,
                borderRadius: 8,
                backgroundColor: isSelected ? colors.brown[900] : 'transparent',
              }}
            >
              <option.icon size={20} color={isSelected ? colors.cream[100] : colors.brown[900]} />
              <Typography
                variant="body-base"
                weight="bold"
                color={isSelected ? colors.cream[100] : colors.brown[900]}
                style={{ flex: 1 }}
              >
                {option.label}
              </Typography>
              {isSelected && <Check size={20} color={colors.cream[100]} strokeWidth={2.5} />}
            </PressableWithHaptics>
          );
        })}
      </View>
    </BaseSheet>
  );
};
