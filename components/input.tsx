import { colors } from '@/constants/colors';
import { ComponentProps } from 'react';
import { StyleSheet } from 'react-native';
import { TextInput as _TextInput } from 'react-native-gesture-handler';
import { MaskedTextInput } from 'react-native-advanced-input-mask';

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

type NumberInputProps = Omit<
  ComponentProps<typeof MaskedTextInput>,
  'onChangeText' | 'keyboardType' | 'mask' | 'allowedKeys' | 'autocomplete' | 'validationRegex'
> & {
  onChangeText: (value: string) => void;
};

export const NumberInput = ({ onChangeText, onBlur, style, ...props }: NumberInputProps) => (
  <MaskedTextInput
    mask="[099999999].[099]"
    allowedKeys="0123456789.,"
    validationRegex={'^(?!.*[.,].*[.,])(?!0\\d)\\d*[.,]?\\d*$'}
    autocomplete={false}
    keyboardType="decimal-pad"
    onChangeText={onChangeText}
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
