import { colors } from '@/constants/colors';
import { ComponentProps } from 'react';
import { StyleSheet } from 'react-native';
import { TextInput as _TextInput } from 'react-native-gesture-handler';

export const TextInput = ({ style, ...props }: ComponentProps<typeof _TextInput>) => {
  return (
    <_TextInput
      style={[styles.input, style]}
      placeholderTextColor={colors.brown[800] + 'C0'} // 75% opacity in hex
      autoCorrect={false}
      {...props}
    />
  );
};

type NumberInputProps = Omit<ComponentProps<typeof TextInput>, 'onChangeText' | 'keyboardType'> & {
  onChangeText: (value: string) => void;
};

export const NumberInput = ({ onChangeText, onBlur, ...props }: NumberInputProps) => {
  const normalize = (raw: string) => {
    if (raw === '') return '0';
    const normalized = raw.replace(',', '.');
    const stripped = normalized.replace(/^0+/, '');
    return stripped === '' || stripped.startsWith('.') ? '0' + stripped : stripped;
  };

  const handleBlur = (e: Parameters<Exclude<typeof onBlur, undefined>>[0]) => {
    onChangeText(normalize(props.value?.toString() ?? ''));
    onBlur?.(e);
  };

  return <TextInput keyboardType="decimal-pad" onChangeText={onChangeText} onBlur={handleBlur} {...props} />;
};

const styles = StyleSheet.create({
  input: {
    borderRadius: 8,
    fontSize: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderBottomWidth: 2,
    backgroundColor: colors.cream[100],
    borderColor: colors.brown[900],
    color: colors.brown[900],
    fontFamily: 'Satoshi-Medium',
    height: 48,
  },
});
