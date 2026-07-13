import { PressableWithHaptics } from '@/components/pressable-with-feedback';
import { Typography } from '@/components/Typography';
import { colors } from '@/constants/colors';
import { formatFriendlyDate } from '@/date-tools';
import { CalendarDays } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

type DateSelectInputProps = {
  label: string;
  onPress: () => void;
  value: string;
};

export const DateSelectInput = ({ label, onPress, value }: DateSelectInputProps) => {
  const formattedDate = formatFriendlyDate(value);

  return (
    <View>
      <Typography variant="body-sm" weight="bold" style={styles.label}>
        {label}
      </Typography>
      <PressableWithHaptics
        accessibilityLabel={`${label}, ${formattedDate}`}
        accessibilityHint="Opens the date picker"
        accessibilityRole="button"
        onPress={onPress}
        scaleTo={0.98}
        style={styles.input}
      >
        <Typography variant="body-base" weight="medium" color={colors.brown[900]} style={styles.value}>
          {formattedDate}
        </Typography>
        <CalendarDays color={colors.brown[900]} size={22} strokeWidth={2.25} />
      </PressableWithHaptics>
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    marginBottom: 4,
  },
  input: {
    alignItems: 'center',
    backgroundColor: colors.cream[100],
    borderColor: colors.brown[900],
    borderRadius: 8,
    borderWidth: 1,
    borderBottomWidth: 2,
    flexDirection: 'row',
    gap: 12,
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  value: {
    flex: 1,
  },
});
