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
