import { Button } from '@/components/button';
import { NumberInput } from '@/components/input';
import { Typography } from '@/components/Typography';
import { View } from 'react-native';

export type ReminderFrequencyUnit = 'days' | 'weeks' | 'months';

type ReminderFrequencyFieldsProps = {
  value: string;
  unit: ReminderFrequencyUnit;
  onValueChange: (value: string) => void;
  onUnitChange: (unit: ReminderFrequencyUnit) => void;
};

export const ReminderFrequencyFields = ({
  value,
  unit,
  onValueChange,
  onUnitChange,
}: ReminderFrequencyFieldsProps) => {
  return (
    <View style={{ gap: 8 }}>
      <Typography variant="body-sm" weight="bold">
        Reminder frequency
      </Typography>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <NumberInput value={value} onChangeText={onValueChange} placeholder="1" style={{ flex: 1 }} />
        {(['days', 'weeks', 'months'] as const).map((option) => (
          <Button
            key={option}
            text={option}
            size="small"
            variant={unit === option ? 'primary' : 'outlined'}
            onPress={() => onUnitChange(option)}
          />
        ))}
      </View>
    </View>
  );
};
