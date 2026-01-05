import { ComponentProps } from 'react';
import { StyleSheet } from 'react-native';
import { TextInput as _TextInput } from 'react-native-gesture-handler';

export const TextInput = ({ style, ...props }: ComponentProps<typeof _TextInput>) => {
  return <_TextInput style={[styles.input, style]} placeholderTextColor="#958270" {...props} />;
};

const styles = StyleSheet.create({
  input: {
    borderRadius: 8,
    fontSize: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderBottomWidth: 2,
    borderColor: '#493D34',
    color: '#493D34',
    fontFamily: 'Satoshi-Bold',
    height: 48,
  },
});
