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

type NumberInputProps = Omit<ComponentProps<typeof _TextInput>, 'onChangeText' | 'keyboardType'> & {
  onChangeText: (value: string) => void;
};

const cleanNumberText = (value: string) => {
  const digitsAndSeparators = value.replace(/[^0-9.,]/g, '');
  const separatorIndex = digitsAndSeparators.search(/[.,]/);

  if (separatorIndex === -1) return digitsAndSeparators;

  const before = digitsAndSeparators.slice(0, separatorIndex);
  const separator = digitsAndSeparators[separatorIndex];
  const after = digitsAndSeparators.slice(separatorIndex + 1).replace(/[.,]/g, '');

  return `${before}${separator}${after}`;
};

export const NumberInput = ({ onChangeText, style, ...props }: NumberInputProps) => (
  <_TextInput
    keyboardType="decimal-pad"
    onChangeText={(value) => onChangeText(cleanNumberText(value))}
    placeholderTextColor={colors.brown[800] + 'C0'}
    autoCorrect={false}
    style={[styles.input, style]}
    {...props}
  />
);

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
