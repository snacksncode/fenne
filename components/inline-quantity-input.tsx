import { NumberInput, TextInputRef } from '@/components/input';
import { Typography } from '@/components/Typography';
import { colors } from '@/constants/colors';
import { useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

type InlineQuantityInputProps = {
  accessibilityLabel: string;
  onBlur: () => void;
  onChangeText: (value: string) => void;
  unit: string;
  value: string;
};

export const InlineQuantityInput = ({
  accessibilityLabel,
  onBlur,
  onChangeText,
  unit,
  value,
}: InlineQuantityInputProps) => {
  const inputRef = useRef<TextInputRef>(null);

  return (
    <Pressable accessible={false} accessibilityRole="none" onPress={() => inputRef.current?.focus()} style={styles.container}>
      <NumberInput
        ref={inputRef}
        accessible
        accessibilityLabel={accessibilityLabel}
        accessibilityValue={{ text: `${value || '0'} ${unit}` }}
        onBlur={onBlur}
        onChangeText={onChangeText}
        placeholder="0"
        style={styles.input}
        value={value}
      />
      <View pointerEvents="none" style={styles.unitPill}>
        <Typography variant="body-sm" weight="bold" color={colors.cream[100]} numberOfLines={1} style={styles.unitText}>
          {unit}
        </Typography>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.cream[100],
    borderColor: colors.brown[900],
    borderRadius: 8,
    borderWidth: 1,
    borderBottomWidth: 2,
    flexDirection: 'row',
    minHeight: 48,
    paddingLeft: 16,
    paddingRight: 10,
  },
  input: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
    borderRadius: 0,
    borderWidth: 0,
    flex: 1,
    fontSize: 22,
    minHeight: 46,
    paddingHorizontal: 0,
    textAlign: 'left',
  },
  unitPill: {
    alignItems: 'center',
    backgroundColor: colors.orange[500],
    borderColor: colors.orange[600],
    borderRadius: 999,
    borderWidth: 2,
    borderBottomWidth: 3,
    height: 28,
    justifyContent: 'center',
    minWidth: 40,
    paddingHorizontal: 8,
  },
  unitText: {
    lineHeight: 14,
    textAlign: 'center',
  },
});
