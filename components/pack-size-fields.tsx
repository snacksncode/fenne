import { NumberInput } from '@/components/input';
import { Button } from '@/components/button';
import { Typography } from '@/components/Typography';
import { Unit } from '@/lib/quantity';
import { colors } from '@/constants/colors';
import { View } from 'react-native';
import { prettyUnit } from '@/lib/quantity';

export const PackSizeFields = ({ unit, values, onChange }: {
  unit: Unit; values: string[]; onChange: (values: string[]) => void;
}) => (
  <View style={{ gap: 8 }}>
    <Typography variant="body-sm" weight="bold">Pack sizes (optional)</Typography>
    <Typography variant="body-xs" weight="medium" color={colors.brown[700]}>
      Add the sizes you usually buy, in {prettyUnit({ unit, quantity: 2 })}. Leave empty if you buy loose.
    </Typography>
    {values.map((value, index) => (
      <View key={index} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <NumberInput
          accessibilityLabel={`Pack size ${index + 1} in ${unit}`}
          value={value} placeholder="e.g. 500" style={{ flex: 1 }}
          onChangeText={(next) => onChange(values.map((item, i) => i === index ? next : item))}
        />
        <Typography variant="body-sm" weight="bold">{prettyUnit({ unit, quantity: 2 })}</Typography>
        <Button text="Remove" size="small" variant="outlined" onPress={() => onChange(values.filter((_, i) => i !== index))} />
      </View>
    ))}
    {values.length < 6 && <Button text="Add pack size" size="small" variant="outlined" onPress={() => onChange([...values, ''])} />}
  </View>
);
