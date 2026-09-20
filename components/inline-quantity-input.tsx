import { NumberInput, TextInputRef } from '@/components/input';
import { Typography } from '@/components/Typography';
import { colors } from '@/constants/colors';
import { Ref, useImperativeHandle, useRef } from 'react';
import { Pressable, StyleProp, StyleSheet, TextStyle, View, ViewStyle } from 'react-native';

type InlineQuantityInputProps = {
  accessibilityLabel: string;
  onBlur: () => void;
  onChangeText: (value: string) => void;
  unit: string;
  value: string;
  ref?: Ref<TextInputRef>;
  editable?: boolean;
  placeholder?: string;
  tone?: 'orange' | 'green';
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
};

export const InlineQuantityInput = ({
  accessibilityLabel,
  onBlur,
  onChangeText,
  unit,
  value,
  ref,
  editable = true,
  placeholder = '0',
  tone = 'orange',
  containerStyle,
  inputStyle,
}: InlineQuantityInputProps) => {
  const inputRef = useRef<TextInputRef>(null);
  useImperativeHandle(ref, () => inputRef.current!, []);

  return (
    <Pressable accessible={false} accessibilityRole="none" disabled={!editable}
      onPress={() => inputRef.current?.focus()} style={[styles.container, containerStyle]}>
      <NumberInput
        ref={inputRef}
        accessible
        editable={editable}
        accessibilityLabel={accessibilityLabel}
        accessibilityValue={{ text: `${value || '0'} ${unit}` }}
        onBlur={onBlur}
        onChangeText={onChangeText}
        placeholder={placeholder}
        style={[styles.input, inputStyle]}
        value={value}
      />
      <View pointerEvents="none" style={[styles.unitPill, tone === 'green' && styles.greenUnitPill]}>
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
  greenUnitPill: { backgroundColor: colors.green[600], borderColor: colors.green[700] },
});
