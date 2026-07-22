import { Button } from '@/components/button';
import { Typography } from '@/components/Typography';
import { ReactNode } from 'react';
import { View } from 'react-native';

export type ReminderFrequencyUnit = 'days' | 'weeks' | 'months';

type ReminderFrequencyFieldsProps = {
  input: ReactNode;
  unit: ReminderFrequencyUnit;
  onUnitChange: (unit: ReminderFrequencyUnit) => void;
};

export const ReminderFrequencyFields = ({
  input,
  unit,
  onUnitChange,
}: ReminderFrequencyFieldsProps) => {
  return (
    <View style={{ gap: 8 }}>
      <Typography variant="body-sm" weight="bold">
        Reminder frequency
      </Typography>
      <View style={{ alignItems: 'center', flexDirection: 'row', gap: 8 }}>
        {input}
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
